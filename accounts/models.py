from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _ # For translatable strings
# from titlecase import titlecase


# Custom function to capitalize only the first letter of each word, preserving rest of casing
def capitalize_first_letter_of_each_word(text):
    if not text:
        return text
    text = text.strip() # Remove leading/trailing whitespace
    
    words = text.split() # Split the string into words by spaces
    capitalized_words = []
    for word in words:
        if word: # Ensure the word is not empty (handles multiple spaces)
            # Capitalize the first character and concatenate with the rest of the word
            capitalized_words.append(word[0].upper() + word[1:])
    
    return ' '.join(capitalized_words)

# Create your models here.
class User(AbstractUser):
    USER_TYPES = (
        ('explorer', 'Explorer'),
        ('entrepreneur', 'Entrepreneur'),
        ('investor', 'Investor'),
    )
    
    user_type = models.CharField(max_length=12, choices=USER_TYPES, default='explorer')
    company_name = models.CharField(max_length=100, blank=True)
    
    # Override first/last name to make optional
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    
    def is_investor(self):
        return self.user_type == 'investor'
    
    def is_entrepreneur(self):
        return self.user_type == 'entrepreneur'
    
    def is_explorer(self):
        return self.user_type == 'explorer'
    
    def get_full_name(self):
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.username
    
    def save(self, *args, **kwargs):
        if self.first_name is None:
            self.first_name = ''
        if self.last_name is None:
            self.last_name = ''
        if self.company_name is None:
            self.company_name = ''

        # Apply title casing (now that we're sure fields are strings, not None)
        if self.first_name:
            self.first_name = capitalize_first_letter_of_each_word(self.first_name)
        if self.last_name:
            self.last_name = capitalize_first_letter_of_each_word(self.last_name)
        
        if self.company_name:
            # Apply the same custom capitalization for company names
            self.company_name = capitalize_first_letter_of_each_word(self.company_name)
            # Or if you *really* need exact branding for company_name:
            # self.company_name = self.company_name.strip()

        super().save(*args, **kwargs) # Call the original save method