from django import forms
from .models import Fact

class FactForm(forms.ModelForm):
    class Meta:
        model = Fact
        fields = ['title', 'answer']