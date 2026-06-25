from django.apps import AppConfig


class AbsencesConfig(AppConfig):
    name = 'absences'

    def ready(self):
        import absences.signals  # noqa: F401
