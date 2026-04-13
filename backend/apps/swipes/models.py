from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone


class SwipeListing(models.Model):
    """
    Represents a meal swipe listing - either a donation offer or a request.
    """
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    TYPE_CHOICES = [
        ('donation', 'Donation'),
        ('request', 'Request'),
    ]

    CAMPUS_CHOICES = [
        ('RH', 'Rose Hill'),
        ('LC', 'Lincoln Center'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='listings'
    )
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    campus = models.CharField(max_length=2, choices=CAMPUS_CHOICES)
    dining_hall = models.CharField(max_length=100, blank=True)
    quantity = models.IntegerField(default=1)
    available_date = models.DateField()
    available_time = models.TimeField(blank=True, null=True)
    meeting_location = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'type', 'campus']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['available_date']),
        ]

    def __str__(self):
        return f"{self.get_type_display()} - {self.user.full_name} ({self.campus})"

    def clean(self):
        """Validate listing data"""
        if self.quantity <= 0:
            raise ValidationError("Quantity must be greater than 0")

        if self.available_date < timezone.now().date():
            raise ValidationError("Available date cannot be in the past")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def is_active(self):
        """Check if listing is still active and available"""
        return self.status == 'open' and self.available_date >= timezone.now().date()


class SwipeMatch(models.Model):
    """
    Represents a match between a donation listing and a request listing.
    Links to Firebase for real-time messaging.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    donation_listing = models.ForeignKey(
        SwipeListing,
        on_delete=models.CASCADE,
        related_name='donation_matches'
    )
    request_listing = models.ForeignKey(
        SwipeListing,
        on_delete=models.CASCADE,
        related_name='request_matches'
    )
    donor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='donations'
    )
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='requests'
    )
    firebase_conversation_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    completed_at = models.DateTimeField(null=True, blank=True)
    donor_confirmed = models.BooleanField(default=False)
    requester_confirmed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['donor', 'status']),
            models.Index(fields=['requester', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f"Match: {self.donor.full_name} → {self.requester.full_name}"

    def clean(self):
        """Validate match data"""
        if self.donation_listing.type != 'donation':
            raise ValidationError("donation_listing must be of type 'donation'")

        if self.request_listing.type != 'request':
            raise ValidationError("request_listing must be of type 'request'")

        if self.donor != self.donation_listing.user:
            raise ValidationError("donor must be the owner of donation_listing")

        if self.requester != self.request_listing.user:
            raise ValidationError("requester must be the owner of request_listing")

        if self.donor == self.requester:
            raise ValidationError("donor and requester cannot be the same user")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def complete_match(self):
        """Mark match as completed and update user statistics"""
        if self.donor_confirmed and self.requester_confirmed:
            self.status = 'completed'
            self.completed_at = timezone.now()
            self.save()

            # Update listing statuses
            self.donation_listing.status = 'completed'
            self.donation_listing.save()
            self.request_listing.status = 'completed'
            self.request_listing.save()

            # Update user statistics
            self.donor.swipes_donated += 1
            self.donor.update_reliability_score()
            self.donor.save()

            self.requester.swipes_received += 1
            self.requester.update_reliability_score()
            self.requester.save()

            return True
        return False

    def cancel_match(self):
        """Cancel the match and reopen listings"""
        self.status = 'cancelled'
        self.save()

        # Reopen listings if they were pending
        if self.donation_listing.status == 'pending':
            self.donation_listing.status = 'open'
            self.donation_listing.save()

        if self.request_listing.status == 'pending':
            self.request_listing.status = 'open'
            self.request_listing.save()
