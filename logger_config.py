"""
Configuración del sistema de logging
"""
import logging
import os

def setup_logger():
    """Configura el logger principal del sistema"""
    log_dir = '/home/pi/weather_station/logs' if not os.path.exists('/tmp') else '/tmp'
    os.makedirs(log_dir, exist_ok=True)
    
    logger = logging.getLogger('weather_station')
    logger.setLevel(logging.INFO)
    
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    
    # Handler para consola
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    
    logger.addHandler(console_handler)
    return logger

logger = setup_logger()
