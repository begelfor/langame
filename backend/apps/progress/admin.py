from django.contrib import admin

from .models import ExerciseAttempt, LessonProgress


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ("player", "lesson", "status", "best_accuracy", "completed_at")
    list_filter = ("status",)
    raw_id_fields = ("player", "lesson")


@admin.register(ExerciseAttempt)
class ExerciseAttemptAdmin(admin.ModelAdmin):
    list_display = ("id", "player", "exercise", "skill", "is_correct", "created_at")
    list_filter = ("is_correct",)
    raw_id_fields = ("player", "exercise", "skill")
    date_hierarchy = "created_at"
