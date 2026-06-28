"""Content models authored in Django Admin.

See docs/data-model.md. The unit a learner masters is a generic ``Skill``;
in the MVP the only kind is vocabulary, represented by the ``VocabularyItem``
detail attached one-to-one to a ``Skill``.
"""
from django.db import models


class Language(models.Model):
    class Direction(models.TextChoices):
        LTR = "ltr", "Left to right"
        RTL = "rtl", "Right to left"

    code = models.CharField(max_length=8, unique=True, help_text="e.g. 'en', 'he'")
    name = models.CharField(max_length=64)
    direction = models.CharField(
        max_length=3, choices=Direction.choices, default=Direction.LTR
    )

    def __str__(self):
        return f"{self.name} ({self.code})"


class MediaAsset(models.Model):
    class Kind(models.TextChoices):
        AUDIO = "audio", "Audio"
        IMAGE = "image", "Image"

    kind = models.CharField(max_length=8, choices=Kind.choices)
    file = models.FileField(upload_to="media_assets/")
    alt_text = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.kind}: {self.file.name}"


class Course(models.Model):
    source_language = models.ForeignKey(
        Language, on_delete=models.PROTECT, related_name="courses_as_source"
    )
    target_language = models.ForeignKey(
        Language, on_delete=models.PROTECT, related_name="courses_as_target"
    )
    title = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class Unit(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="units")
    title = models.CharField(max_length=120)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.title


class Lesson(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name="lessons")
    title = models.CharField(max_length=120)
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.title


class Skill(models.Model):
    """The unit a learner masters and that spaced repetition schedules."""

    class Kind(models.TextChoices):
        VOCABULARY = "vocabulary", "Vocabulary"
        # Future: GRAMMAR = "grammar", GRAPHEME = "grapheme", PHONICS = "phonics"

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="skills")
    kind = models.CharField(
        max_length=20, choices=Kind.choices, default=Kind.VOCABULARY
    )
    label = models.CharField(max_length=120, help_text="Human-readable, for Admin")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.label} [{self.kind}]"


class VocabularyItem(models.Model):
    """Vocabulary detail of a Skill (kind=vocabulary)."""

    skill = models.OneToOneField(
        Skill, on_delete=models.CASCADE, related_name="vocabulary_item"
    )
    text_en = models.CharField(max_length=255, help_text="English word/phrase taught")
    part_of_speech = models.CharField(max_length=32, blank=True)
    hebrew_hint = models.CharField(
        max_length=255, blank=True, help_text="Optional Hebrew translation scaffold"
    )
    definition_en = models.TextField(blank=True)
    example_en = models.TextField(blank=True)
    audio = models.ForeignKey(
        MediaAsset,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vocabulary_audio",
    )
    image = models.ForeignKey(
        MediaAsset,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vocabulary_image",
    )

    def __str__(self):
        return self.text_en


class Exercise(models.Model):
    class Type(models.TextChoices):
        MULTIPLE_CHOICE = "multiple_choice", "Multiple choice"
        MATCHING = "matching", "Matching"
        LISTENING = "listening", "Listening"
        TYPING = "typing", "Typing"

    lesson = models.ForeignKey(
        Lesson, on_delete=models.CASCADE, related_name="exercises"
    )
    type = models.CharField(max_length=20, choices=Type.choices)
    payload = models.JSONField(
        default=dict,
        blank=True,
        help_text="Type-specific data: prompt mode, options, answer, etc.",
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.type} #{self.pk} (lesson {self.lesson_id})"


class ExerciseItem(models.Model):
    """Join: which skills an exercise targets."""

    exercise = models.ForeignKey(
        Exercise, on_delete=models.CASCADE, related_name="items"
    )
    skill = models.ForeignKey(
        Skill, on_delete=models.CASCADE, related_name="exercise_items"
    )
    role = models.CharField(max_length=32, blank=True, help_text="e.g. 'target'")
    is_primary = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["exercise", "skill"], name="unique_exercise_skill"
            )
        ]

    def __str__(self):
        return f"{self.exercise_id} -> {self.skill_id}"
