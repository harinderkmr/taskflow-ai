from rest_framework import serializers
from django.contrib.auth import get_user_model
from ..models import Project

User = get_user_model()

class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name")

class ProjectSerializer(serializers.ModelSerializer):
    owner = UserSimpleSerializer(read_only=True)
    members_detail = UserSimpleSerializer(source="members", many=True, read_only=True)
    members = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        required=False,
    )

    class Meta:
        model = Project
        fields = (
            "id",
            "name",
            "description",
            "owner",
            "members",
            "members_detail",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "owner", "created_at", "updated_at")

    def create(self, validated_data):
        # The view will pass the request user as the owner
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["owner"] = request.user
        
        members = validated_data.pop("members", [])
        project = Project.objects.create(**validated_data)
        if members:
            project.members.set(members)
        return project
