import os
import uuid
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings


ALLOWED_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
MAX_SIZE_MB = 5


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def upload_image(request):
    file = request.FILES.get('image')
    if not file:
        return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

    if file.content_type not in ALLOWED_TYPES:
        return Response({'error': 'Only JPEG, PNG, GIF and WebP images are allowed'}, status=status.HTTP_400_BAD_REQUEST)

    if file.size > MAX_SIZE_MB * 1024 * 1024:
        return Response({'error': f'Image must be under {MAX_SIZE_MB}MB'}, status=status.HTTP_400_BAD_REQUEST)

    ext = os.path.splitext(file.name)[1].lower() or '.jpg'
    filename = f"{uuid.uuid4().hex}{ext}"
    upload_dir = os.path.join(settings.MEDIA_ROOT, 'uploads', 'posts')
    os.makedirs(upload_dir, exist_ok=True)

    filepath = os.path.join(upload_dir, filename)
    with open(filepath, 'wb') as f:
        for chunk in file.chunks():
            f.write(chunk)

    url = request.build_absolute_uri(f"/media/uploads/posts/{filename}")
    return Response({'url': url}, status=status.HTTP_201_CREATED)
