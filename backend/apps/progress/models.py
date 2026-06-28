"""Progress and raw event models.

See docs/data-model.md. ``ExerciseAttempt`` is the append-only event log that
feeds personalization; ``LessonProgress`` tracks per-player lesson completion.
"""
from django.db import models


class LessonProgress(models.Model):
    class Status(models.TextChoices):
        NOT_STARTED = "not_started", "Not started"
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"

    player = models.ForeignKey(
        "accounts.Player",
        on_delete=models.CASCADE,
        related_name="lesson_progress",
    )
    lesson = models.ForeignKey(
        "content.Lesson", on_delete=models.CASCADE, related_name="progress"
    )
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.NOT_STARTED
    )
    best_accuracy = models.FloatField(default=0.0)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["player", "lesson"], name="unique_player_lesson"
            )
        ]

    def __str__(self):
        return f"{self.player_id} / {self.lesson_id}: {self.status}"


class ExerciseAttempt(models.Model):
    """Append-only event log. One row per skill targeted by an exercise."""

    player = models.ForeignKey(
        "accounts.Player", on_delete=models.CASCADE, related_name="attempts"
    )
    exercise = models.ForeignKey(
        "content.Exercise", on_delete=models.CASCADE, related_name="attempts"
    )
    skill = models.ForeignKey(
        "content.Skill", on_delete=models.CASCADE, related_name="attempts"
    )
    is_correct = models.BooleanField()
    latency_ms = models.PositiveIntegerField(null=True, blank=True)
    answer_given = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["player", "created_at"]),
            models.Index(fields=["player", "skill"]),
        ]

    def __str__(self):
        return f"{self.player_id} ex={self.exercise_id} correct={self.is_correct}"
