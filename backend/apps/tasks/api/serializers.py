from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.projects.models import Project
from apps.accounts.api.serializers import UserSerializer
from ..models import Task

User = get_user_model()

class TaskSerializer(serializers.ModelSerializer):
    # Field to handle writing project ID
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())
    # Detail fields for response payload
    assignee_detail = UserSerializer(source="assignee", read_only=True)
    project_name = serializers.ReadOnlyField(source="project.name")

    class Meta:
        model = Task
        fields = (
            "id",
            "project",
            "project_name",
            "title",
            "description",
            "status",
            "priority",
            "assignee",
            "assignee_detail",
            "due_date",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        # Optional: ensure that the user assigning the task has permission or the assignee is valid
        # For simplicity, we just check that the project is owned by or includes the request user
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            project = attrs.get("project")
            if project and project.owner != request.user and not project.members.filter(id=request.user.id).exists():
                raise serializers.ValidationError("You do not have access to this project.")
        return attrs
