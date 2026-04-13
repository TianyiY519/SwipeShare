from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator


class User(AbstractUser):
    """
    Custom User model for Fordham SwipeShare.
    Extends Django's AbstractUser with additional fields.
    """

    CAMPUS_CHOICES = [
        ('RH', 'Rose Hill'),
        ('LC', 'Lincoln Center'),
    ]

    # Override email to make it unique and required
    email = models.EmailField(unique=True, blank=False)

    # Fordham-specific fields
    fordham_id = models.CharField(max_length=20, blank=True, null=True, help_text="Fordham student ID")
    campus = models.CharField(max_length=2, choices=CAMPUS_CHOICES, default='RH')

    # Profile information
    full_name = models.CharField(max_length=100)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    bio = models.TextField(blank=True, max_length=500)

    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone_number = models.CharField(validators=[phone_regex], max_length=17, blank=True)

    # Swipe statistics
    swipes_donated = models.IntegerField(default=0, help_text="Total swipes donated")
    swipes_received = models.IntegerField(default=0, help_text="Total swipes received")
    reliability_score = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        default=5.0,
        help_text="Reliability score (1.0-5.0)"
    )

    # Email verification
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=100, blank=True, null=True)

    # Suspension
    suspended_until = models.DateTimeField(null=True, blank=True, help_text="If set, user is suspended until this datetime")

    # Push notifications
    fcm_token = models.CharField(max_length=255, blank=True, null=True, help_text="Firebase Cloud Messaging token")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Make email the unique identifier for authentication
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'full_name']  # username required by Django, full_name custom

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} ({self.email})"

    def update_reliability_score(self):
        """
        Calculate and update reliability score based on completed swipes.
        Called after a swipe match is confirmed.
        """
        total_swipes = self.swipes_donated + self.swipes_received
        if total_swipes > 0:
            # Simple calculation - can be made more complex
            completion_rate = (self.swipes_donated + self.swipes_received) / total_swipes
            self.reliability_score = min(5.0, max(1.0, completion_rate * 5.0))
            self.save(update_fields=['reliability_score'])

    @property
    def is_fordham_email(self):
        """Check if email is a Fordham email."""
        return self.email.endswith('@fordham.edu')
