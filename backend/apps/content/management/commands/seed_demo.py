"""Seed a small demo course/lesson so the content model can be exercised.

This is for local verification and demos. Real content is authored in Django
Admin. Safe to run repeatedly (idempotent via get_or_create).

    uv run python manage.py seed_demo
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.content.models import (
    Course,
    Exercise,
    ExerciseItem,
    Language,
    Lesson,
    Skill,
    Unit,
    VocabularyItem,
)

WORDS = [
    {"text": "apple", "hint": "תפוח", "options": ["apple", "orange", "bread", "water"]},
    {"text": "water", "hint": "מים", "options": ["water", "milk", "apple", "rice"]},
    {"text": "bread", "hint": "לחם", "options": ["bread", "cheese", "apple", "water"]},
    {"text": "milk", "hint": "חלב", "options": ["milk", "water", "egg", "bread"]},
]


class Command(BaseCommand):
    help = "Create a demo HE->EN course with one unit, one lesson, and exercises."

    @transaction.atomic
    def handle(self, *args, **options):
        he, _ = Language.objects.get_or_create(
            code="he", defaults={"name": "Hebrew", "direction": Language.Direction.RTL}
        )
        en, _ = Language.objects.get_or_create(
            code="en", defaults={"name": "English", "direction": Language.Direction.LTR}
        )

        course, _ = Course.objects.get_or_create(
            source_language=he,
            target_language=en,
            title="English for Hebrew speakers",
            defaults={"description": "MVP demo course", "is_published": True},
        )
        unit, _ = Unit.objects.get_or_create(course=course, title="Food", defaults={"order": 1})
        lesson, _ = Lesson.objects.get_or_create(
            unit=unit, title="Food basics", defaults={"order": 1, "is_published": True}
        )

        for i, word in enumerate(WORDS, start=1):
            skill, _ = Skill.objects.get_or_create(
                course=course,
                label=word["text"],
                defaults={"kind": Skill.Kind.VOCABULARY, "order": i},
            )
            VocabularyItem.objects.get_or_create(
                skill=skill,
                defaults={"text_en": word["text"], "hebrew_hint": word["hint"]},
            )
            exercise, created = Exercise.objects.get_or_create(
                lesson=lesson,
                type=Exercise.Type.MULTIPLE_CHOICE,
                order=i,
                defaults={
                    "payload": {
                        "prompt_mode": "hebrew",
                        "prompt": {"hebrew": word["hint"]},
                        "options": word["options"],
                        "answer": word["text"],
                    }
                },
            )
            if created:
                ExerciseItem.objects.create(
                    exercise=exercise, skill=skill, role="target", is_primary=True
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded: course={course.id} unit={unit.id} lesson={lesson.id} "
                f"skills={Skill.objects.filter(course=course).count()} "
                f"exercises={Exercise.objects.filter(lesson=lesson).count()}"
            )
        )
