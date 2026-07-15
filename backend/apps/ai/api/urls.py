from django.urls import path
from .views import AICopilotView

urlpatterns = [
    path("copilot/", AICopilotView.as_view(), name="ai_copilot"),
]
