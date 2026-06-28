from django.contrib import admin

from .models import (
    Course,
    Exercise,
    ExerciseItem,
    Language,
    Lesson,
    MediaAsset,
    Skill,
    Unit,
    VocabularyItem,
)


@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "direction")


@admin.register(MediaAsset)
class MediaAssetAdmin(admin.ModelAdmin):
    list_display = ("id", "kind", "file", "alt_text")
    list_filter = ("kind",)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "source_language", "target_language", "is_published")
    list_filter = ("is_published",)


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 1


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "order")
    list_filter = ("course",)
    ordering = ("course", "order")
    inlines = [LessonInline]


class ExerciseInline(admin.TabularInline):
    model = Exercise
    extra = 1


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("title", "unit", "order", "is_published")
    list_filter = ("is_published", "unit__course")
    ordering = ("unit", "order")
    inlines = [ExerciseInline]


class VocabularyItemInline(admin.StackedInline):
    model = VocabularyItem
    extra = 0
    can_delete = False


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("label", "course", "kind", "order")
    list_filter = ("kind", "course")
    ordering = ("course", "order")
    search_fields = ("label", "vocabulary_item__text_en")
    inlines = [VocabularyItemInline]


class ExerciseItemInline(admin.TabularInline):
    model = ExerciseItem
    extra = 1
    autocomplete_fields = ("skill",)


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ("id", "lesson", "type", "order")
    list_filter = ("type", "lesson__unit__course")
    inlines = [ExerciseItemInline]
