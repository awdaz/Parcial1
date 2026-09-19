import logging

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    def enviar_notificacion_reserva_preparada(email: str, reserva_id: int):
        """
        Simula el envío de una notificación al cliente (vía correo o push).
        En un entorno real, aquí se integraría con un proveedor como SendGrid, AWS SES, Firebase, etc.
        """
        mensaje = f"NOTIFICACIÓN ENVIADA: Cliente {email} -> Su reserva #{reserva_id} está lista para probarse."
        logger.info(mensaje)
        # Podríamos guardar esto en una tabla de base de datos también si fuera necesario
        return True
