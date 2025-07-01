from django import template
from django.utils.timesince import timesince
from datetime import datetime, timezone

register = template.Library()

@register.filter
def test_filter(value):
    return "TEST"


@register.filter
def zero_timesince(value):
    if not isinstance(value, datetime):
        return '—'

    if value.tzinfo is None:
        now = datetime.now()
    else:
        now = datetime.now(timezone.utc)

    # Normalize timesince output: remove 'ago', normalize spaces, and lowercase
    delta = timesince(value, now).replace(' ago', '').replace('\xa0', ' ').strip().lower()
    first_part_of_delta = delta.split(',')[0].strip()
    parts = first_part_of_delta.split(' ')

    # Debug print to verify processing
    # print(f"Debug: delta={delta}, first_part_of_delta={first_part_of_delta}, parts={parts}")

    if len(parts) >= 2:
        number = parts[0]
        unit = ' '.join(parts[1:]).lower()

        short_units = {
            'minute': 'm', 'minutes': 'm',
            'hour': 'h', 'hours': 'h',
            'day': 'd', 'days': 'd',
            'week': 'w', 'weeks': 'w',
            'month': 'mo', 'months': 'mo',
            'year': 'y', 'years': 'y',
            'second': 's', 'seconds': 's',
        }

        if (number == '0' and unit in ['minute', 'minutes', 'second', 'seconds']) or \
           (number == '1' and unit in ['second', 'seconds']):
            return '0m'

        return f"{number}{short_units.get(unit, unit)}"

    # Handle single-unit cases like '25 minutes' or '1 hour'
    if len(parts) == 2:
        number = parts[0]
        unit = parts[1].lower()
        short_units = {
            'minute': 'm', 'minutes': 'm',
            'hour': 'h', 'hours': 'h',
            'day': 'd', 'days': 'd',
            'week': 'w', 'weeks': 'w',
            'month': 'mo', 'months': 'mo',
            'year': 'y', 'years': 'y',
            'second': 's', 'seconds': 's',
        }
        if (number == '0' and unit in ['minute', 'minutes', 'second', 'seconds']) or \
           (number == '1' and unit in ['second', 'seconds']):
            return '0m'
        return f"{number}{short_units.get(unit, unit)}"

    # Handle edge cases
    if first_part_of_delta in ['0 minutes', '0 seconds', '1 second']:
        return '0m'

    return first_part_of_delta  # Fallback