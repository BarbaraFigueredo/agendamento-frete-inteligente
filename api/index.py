import os
import sys

# Adiciona o diretório backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

os.environ["DJANGO_SETTINGS_MODULE"] = "freight_flow.settings.vercel"

from django.core.wsgi import get_wsgi_application  # noqa: E402

# Vercel precisa que a variável se chame "app"
app = get_wsgi_application()
