"""
Configuración central de la estación meteorológica
"""

# Configuración de pines GPIO (Raspberry Pi)
GPIO_PINS = {
    'TFT_DC': 24,
    'TFT_RST': 25,
    'TFT_CS': 8,
    'TFT_BACKLIGHT': 13,
    'BUTTON': 6,
    'NEOPIXEL': 21,
    'BME280_SDA': 2,
    'BME280_SCL': 3
}

# Configuración MQTT - ACTUALIZADA para módulo exterior v5
MQTT_CONFIG = {
    'LOCAL_BROKER': {
        'host': '192.168.1.184',  # Tu broker MQTT
        'port': 1883,
        'topics': {
            'exterior_temp': 'estacion/exterior/temperatura',
            'exterior_hum': 'estacion/exterior/humedad', 
            'exterior_pres': 'estacion/exterior/presion',
            'exterior_status': 'estacion/exterior/estado'
        }
    },
    'THINGSBOARD': {
        'host': 'thingsboard.cloud',
        'port': 1883,
        'token': '6ckjxmrdcedf2hh1vxir'
    }
}

# Configuración de pantalla TFT
TFT_CONFIG = {
    'width': 320,
    'height': 240,
    'rotation': 1,
    'spi_speed': 64000000
}

# Umbrales de temperatura - SINCRONIZADOS con ESP32
TEMP_THRESHOLDS = {
    'freeze_warning': 2.0,    # Mismo que ALERT_TEMP_LOW del ESP32
    'heat_warning': 35.0,     # Mismo que ALERT_TEMP_HIGH del ESP32
    'temp_change_alarm': 3.0
}

# Colores de la interfaz (RGB565)
UI_COLORS = {
    'primary': 0x06B6,      # Cyan
    'secondary': 0xFD20,    # Orange
    'accent': 0x8C51,       # Purple
    'success': 0x07E0,      # Green
    'warning': 0xFFE0,      # Yellow
    'danger': 0xF800,       # Red
    'background': 0x0841,   # Dark blue
    'text': 0xFFFF,         # White
    'text_secondary': 0xC618 # Light gray
}

# Configuración de NeoPixels
NEOPIXEL_CONFIG = {
    'count': 2,
    'brightness': 0.3,
    'auto_write': False
}

# Modo de prueba para demostrar todos los estados
TEST_MODE = False  # Cambiar a False para uso real
