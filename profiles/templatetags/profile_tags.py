# profiles/templatetags/profile_tags.py
from django import template
import os

register = template.Library()

@register.filter
def basename(value):
    """
    Extract the basename from a file path.
    Example: 'gallery/2023/10/image.jpg' -> 'image.jpg'
    """
    if value:
        return os.path.basename(value)
    return ""