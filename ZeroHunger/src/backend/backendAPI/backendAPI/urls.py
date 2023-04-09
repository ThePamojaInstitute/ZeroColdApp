"""backendAPI URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path


from .views import TestView, UserView

urlpatterns = [
<<<<<<< HEAD:ZeroHunger/src/backend/ZeroHunger/ZeroHunger/urls.py
    path('admin/', admin.site.urls),
    path('api/v1.0/user/', include('backendAPI.urls')),
    path('api/v1.0/app/', include('appSettings.urls'))
=======
    path('admin/', admin.site.urls ), 
    path('api/test', TestView.as_view()),
    path('api/create-user', UserView.as_view()),
    path('api/get-user', UserView.as_view())
>>>>>>> main:ZeroHunger/src/backend/backendAPI/backendAPI/urls.py
]