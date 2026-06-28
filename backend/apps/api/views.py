from datetime import timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.content.models import Exercise, Lesson
from apps.progress.models import ExerciseAttempt, LessonProgress

from .serializers import (
    AttemptBatchSerializer,
    LessonDetailSerializer,
    NextItemSerializer,
    ProgressSerializer,
)

XP_PER_CORRECT = 10


def _get_player(request):
    player = getattr(request.user, "player", None)
    if player is None:
        raise ValidationError(
            "This account has no player profile. Register via /auth/register."
        )
    return player


def _local_today(player):
    """Today's date in the player's timezone, falling back to UTC."""
    try:
        tz = ZoneInfo(player.timezone or "UTC")
    except (ZoneInfoNotFoundError, ValueError):
        tz = ZoneInfo("UTC")
    return timezone.now().astimezone(tz).date()


class NextView(APIView):
    """Tell the app what to do next.

    MVP fallback only: pick the first published lesson the player has not
    completed (else the first published lesson). The RecommendationQueue-backed
    version arrives in M4.
    """

    @extend_schema(responses=NextItemSerializer)
    def get(self, request):
        player = _get_player(request)
        lessons = list(
            Lesson.objects.filter(is_published=True).order_by(
                "unit__order", "order", "id"
            )
        )
        if not lessons:
            data = {
                "item_type": "none",
                "reason": "no_content",
                "lesson": None,
                "estimated_exercises": 0,
            }
            return Response(NextItemSerializer(data).data)

        completed_ids = set(
            LessonProgress.objects.filter(
                player=player, status=LessonProgress.Status.COMPLETED
            ).values_list("lesson_id", flat=True)
        )
        next_lesson = next(
            (lsn for lsn in lessons if lsn.id not in completed_ids), None
        )
        if next_lesson is not None:
            item_type, reason = "new_lesson", "next in unit"
        else:
            next_lesson = lessons[0]
            item_type, reason = "review", "all lessons completed; reviewing"

        data = {
            "item_type": item_type,
            "reason": reason,
            "lesson": {"id": next_lesson.id, "title": next_lesson.title},
            "estimated_exercises": next_lesson.exercises.count(),
        }
        return Response(NextItemSerializer(data).data)


class LessonDetailView(APIView):
    """Fetch a published lesson and its exercises to play."""

    @extend_schema(responses=LessonDetailSerializer)
    def get(self, request, pk):
        lesson = get_object_or_404(
            Lesson.objects.prefetch_related("exercises__items"),
            pk=pk,
            is_published=True,
        )
        return Response(LessonDetailSerializer(lesson).data)


class AttemptsView(APIView):
    """Record exercise results, update lesson progress, and award XP."""

    @extend_schema(request=AttemptBatchSerializer, responses={201: None})
    def post(self, request):
        player = _get_player(request)
        serializer = AttemptBatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lesson_id = serializer.validated_data["lesson_id"]
        attempts = serializer.validated_data["attempts"]

        lesson = get_object_or_404(Lesson, pk=lesson_id, is_published=True)
        exercises = {
            e.id: e
            for e in Exercise.objects.filter(lesson=lesson).prefetch_related("items")
        }

        correct_count = 0
        with transaction.atomic():
            for attempt in attempts:
                exercise = exercises.get(attempt["exercise_id"])
                if exercise is None:
                    raise ValidationError(
                        f"Exercise {attempt['exercise_id']} is not in lesson {lesson_id}."
                    )
                if attempt["is_correct"]:
                    correct_count += 1
                skill_ids = [item.skill_id for item in exercise.items.all()]
                ExerciseAttempt.objects.bulk_create(
                    [
                        ExerciseAttempt(
                            player=player,
                            exercise=exercise,
                            skill_id=skill_id,
                            is_correct=attempt["is_correct"],
                            latency_ms=attempt.get("latency_ms"),
                            answer_given=attempt.get("answer_given", "") or "",
                        )
                        for skill_id in skill_ids
                    ]
                )

            total = len(attempts)
            accuracy = correct_count / total if total else 0.0
            xp_awarded = correct_count * XP_PER_CORRECT

            progress, _ = LessonProgress.objects.get_or_create(
                player=player, lesson=lesson
            )
            progress.status = LessonProgress.Status.COMPLETED
            progress.completed_at = timezone.now()
            progress.best_accuracy = max(progress.best_accuracy, accuracy)
            progress.save()

            player.total_xp += xp_awarded
            player.record_activity(_local_today(player))
            player.save(
                update_fields=[
                    "total_xp",
                    "current_streak",
                    "longest_streak",
                    "last_active_date",
                ]
            )

        return Response(
            {
                "recorded": total,
                "lesson_status": progress.status,
                "xp_awarded": xp_awarded,
                "current_streak": player.current_streak,
            },
            status=status.HTTP_201_CREATED,
        )


class ProgressView(APIView):
    """Stats for the progress screen.

    ``skills_learned`` and ``accuracy_7d`` are derived from the attempt log.
    ``skills_due`` is a placeholder (0) until spaced repetition lands in M4.
    """

    @extend_schema(responses=ProgressSerializer)
    def get(self, request):
        player = _get_player(request)
        since = timezone.now() - timedelta(days=7)
        recent = ExerciseAttempt.objects.filter(player=player, created_at__gte=since)
        total_recent = recent.count()
        correct_recent = recent.filter(is_correct=True).count()
        accuracy_7d = (
            round(correct_recent / total_recent, 2) if total_recent else None
        )
        skills_learned = (
            ExerciseAttempt.objects.filter(player=player, is_correct=True)
            .values("skill")
            .distinct()
            .count()
        )
        data = {
            "display_name": player.display_name,
            "total_xp": player.total_xp,
            "current_streak": player.current_streak,
            "longest_streak": player.longest_streak,
            "skills_learned": skills_learned,
            "skills_due": 0,
            "accuracy_7d": accuracy_7d,
        }
        return Response(ProgressSerializer(data).data)
