from rest_framework import serializers

from apps.content.models import Exercise, Lesson


class ExerciseSerializer(serializers.ModelSerializer):
    skill_ids = serializers.SerializerMethodField()

    class Meta:
        model = Exercise
        fields = ("id", "type", "skill_ids", "payload")

    def get_skill_ids(self, obj) -> list[int]:
        return [item.skill_id for item in obj.items.all()]


class LessonDetailSerializer(serializers.ModelSerializer):
    exercises = ExerciseSerializer(many=True, read_only=True)

    class Meta:
        model = Lesson
        fields = ("id", "title", "exercises")


class NextItemSerializer(serializers.Serializer):
    item_type = serializers.CharField()
    reason = serializers.CharField()
    lesson = serializers.DictField(allow_null=True)
    estimated_exercises = serializers.IntegerField()


class AttemptSerializer(serializers.Serializer):
    exercise_id = serializers.IntegerField()
    is_correct = serializers.BooleanField()
    latency_ms = serializers.IntegerField(required=False, allow_null=True)
    answer_given = serializers.CharField(
        required=False, allow_blank=True, max_length=255
    )


class AttemptBatchSerializer(serializers.Serializer):
    lesson_id = serializers.IntegerField()
    attempts = AttemptSerializer(many=True)

    def validate_attempts(self, value):
        if not value:
            raise serializers.ValidationError("At least one attempt is required.")
        return value
