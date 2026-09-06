import stripe

from app.core.config import get_settings

settings = get_settings()
stripe.api_key = settings.STRIPE_SECRET_KEY


def crear_intencion_pago(monto_total: float, descripcion: str) -> dict:
    """Crea un PaymentIntent de Stripe (modo sandbox/test).

    Retorna el client_secret que la app móvil/web usará para confirmar.
    """
    if settings.STRIPE_SECRET_KEY.startswith("sk_test_placeholder"):
        # Modo de simulación cuando no hay claves reales configuradas.
        return {
            "id": "pi_simulado_" + descripcion[:20].replace(" ", "_"),
            "client_secret": "pi_simulado_secret",
            "simulado": True,
        }
    intent = stripe.PaymentIntent.create(
        amount=int(round(monto_total * 100)),
        currency=settings.STRIPE_CURRENCY,
        description=descripcion,
    )
    return {
        "id": intent.id,
        "client_secret": intent.client_secret,
        "simulado": False,
    }


def confirmar_pago_simulado() -> bool:
    """En modo sandbox sin clave real, asumimos que el pago fue aprobado."""
    return True
