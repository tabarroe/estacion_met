"""
Gestor de hardware - Abstrae toda la interacción con componentes físicos
"""
import time
import board
import busio
import digitalio
import adafruit_bmp280
import adafruit_ili9341
import neopixel
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from config import GPIO_PINS, TFT_CONFIG, UI_COLORS, NEOPIXEL_CONFIG, TEST_MODE
from logger_config import logger

class HardwareManager:
    def __init__(self):
        self.tft = None
        self.bmp280 = None
        self.neopixels = None
        self.button = None
        self.last_button_state = False
        self.button_pressed = False
        
        # Variables para modo de prueba
        self.test_cycle_start = time.time()
        self.test_states = [
            {'temp': -8, 'desc': 'Helada Extrema'},
            {'temp': -2, 'desc': 'Helada'},
            {'temp': 5, 'desc': 'Muy Frío'},
            {'temp': 15, 'desc': 'Frío'},
            {'temp': 20, 'desc': 'Fresco'},
            {'temp': 24, 'desc': 'Óptimo'},
            {'temp': 28, 'desc': 'Cálido'},
            {'temp': 32, 'desc': 'Caluroso'},
            {'temp': 37, 'desc': 'Extremo'}
        ]
        
        # Inicializar componentes (solo si no está en modo prueba)
        if not TEST_MODE:
            self._init_tft()
            self._init_bmp280()
            self._init_neopixels()
            self._init_button()
        else:
            logger.info("Modo de prueba activado - Hardware simulado")
        
        logger.info("Hardware Manager inicializado correctamente")
    
    def _init_tft(self):
        """Inicializa la pantalla TFT ILI9341"""
        try:
            spi = busio.SPI(board.SCK, board.MOSI, board.MISO)
            cs = digitalio.DigitalInOut(getattr(board, f'D{GPIO_PINS["TFT_CS"]}'))
            dc = digitalio.DigitalInOut(getattr(board, f'D{GPIO_PINS["TFT_DC"]}'))
            rst = digitalio.DigitalInOut(getattr(board, f'D{GPIO_PINS["TFT_RST"]}'))
            
            self.tft = adafruit_ili9341.ILI9341(
                spi, cs=cs, dc=dc, rst=rst,
                width=TFT_CONFIG['width'],
                height=TFT_CONFIG['height'],
                rotation=TFT_CONFIG['rotation']
            )
            
            self.tft.fill(UI_COLORS['background'])
            logger.info("Pantalla TFT inicializada")
            
        except Exception as e:
            logger.error(f"Error inicializando TFT: {e}")
            self.tft = None
    
    def _init_bmp280(self):
        """Inicializa el sensor BME280 interior"""
        try:
            i2c = busio.I2C(board.SCL, board.SDA)
            self.bmp280 = adafruit_bmp280.Adafruit_BMP280_I2C(i2c)
            self.bmp280.sea_level_pressure = 1013.25
            logger.info("Sensor BME280 inicializado")
            
        except Exception as e:
            logger.error(f"Error inicializando BME280: {e}")
            self.bmp280 = None
    
    def _init_neopixels(self):
        """Inicializa los LEDs NeoPixel"""
        try:
            self.neopixels = neopixel.NeoPixel(
                getattr(board, f'D{GPIO_PINS["NEOPIXEL"]}'),
                NEOPIXEL_CONFIG['count'],
                brightness=NEOPIXEL_CONFIG['brightness'],
                auto_write=NEOPIXEL_CONFIG['auto_write']
            )
            
            # Test inicial
            self.neopixels.fill((0, 255, 0))
            self.neopixels.show()
            time.sleep(0.5)
            self.neopixels.fill((0, 0, 0))
            self.neopixels.show()
            
            logger.info("NeoPixels inicializados")
            
        except Exception as e:
            logger.error(f"Error inicializando NeoPixels: {e}")
            self.neopixels = None
    
    def _init_button(self):
        """Inicializa el botón táctil"""
        try:
            self.button = digitalio.DigitalInOut(getattr(board, f'D{GPIO_PINS["BUTTON"]}'))
            self.button.direction = digitalio.Direction.INPUT
            self.button.pull = digitalio.Pull.UP
            logger.info("Botón inicializado")
            
        except Exception as e:
            logger.error(f"Error inicializando botón: {e}")
            self.button = None
    
    def get_test_temperature(self):
        """Genera temperatura de prueba que cicla por todos los estados"""
        if not TEST_MODE:
            return None
        
        # Cambiar estado cada 10 segundos
        cycle_time = (time.time() - self.test_cycle_start) % (len(self.test_states) * 10)
        state_index = int(cycle_time // 10)
        current_state = self.test_states[state_index]
        
        logger.info(f"🧪 PRUEBA: {current_state['desc']} - {current_state['temp']}°C")
        return current_state['temp']
    
    def read_local_bmp280(self):
        """Lee el sensor BME280 local o simula datos"""
        if TEST_MODE:
            return {
                'temperature': 22.5,
                'pressure': 1015.2,
                'altitude': 150.0,
                'timestamp': time.time(),
                'online': True
            }
        
        if not self.bmp280:
            return None
        
        try:
            return {
                'temperature': round(self.bmp280.temperature, 1),
                'pressure': round(self.bmp280.pressure, 1),
                'altitude': round(self.bmp280.altitude, 1),
                'timestamp': time.time(),
                'online': True
            }
        except Exception as e:
            logger.error(f"Error leyendo BME280: {e}")
            return None
    
    def is_button_pressed(self):
        """Detecta si el botón ha sido presionado"""
        if TEST_MODE:
            # Simular presión de botón cada 30 segundos en modo prueba
            return int(time.time()) % 30 == 0
        
        if not self.button:
            return False
        
        current_state = not self.button.value
        
        if current_state and not self.last_button_state:
            self.button_pressed = True
        
        self.last_button_state = current_state
        
        if self.button_pressed:
            self.button_pressed = False
            return True
        
        return False
    
    def update_leds(self, interior_temp, exterior_temp, exterior_online, exterior_last_update):
        """Actualiza los LEDs según el estado del sistema y clima"""
        if TEST_MODE:
            # En modo prueba, solo mostrar en logs
            logger.info(f"💡 LED0: {'Verde' if exterior_online else 'Rojo'} | LED1: {self.get_led_color_name(exterior_temp)}")
            return
        
        if not self.neopixels:
            return
        
        try:
            current_time = time.time()
            
            # LED 0: Estado del sistema
            if exterior_online and (current_time - exterior_last_update) < 300:
                self.neopixels[0] = (0, 255, 0)  # Verde - OK
            elif exterior_online and (current_time - exterior_last_update) < 600:
                self.neopixels[0] = (255, 255, 0)  # Amarillo - Datos antiguos
            elif exterior_online:
                self.neopixels[0] = (255, 165, 0)  # Naranja - Muy antiguos
            else:
                self.neopixels[0] = (255, 0, 0)  # Rojo - Sin conexión
            
            # LED 1: Estado climático
            if exterior_online and exterior_temp is not None:
                blink_state = int(current_time * 2) % 2
                
                if exterior_temp >= 35:
                    self.neopixels[1] = (255, 0, 0) if blink_state else (100, 0, 0)
                elif exterior_temp >= 30:
                    self.neopixels[1] = (255, 165, 0)
                elif 26 <= exterior_temp < 30:
                    self.neopixels[1] = (255, 255, 0)
                elif 23 <= exterior_temp < 26:
                    self.neopixels[1] = (0, 255, 0)
                elif 18 <= exterior_temp < 23:
                    self.neopixels[1] = (100, 255, 100)
                elif 10 <= exterior_temp < 18:
                    self.neopixels[1] = (0, 255, 255)
                elif 0 <= exterior_temp < 10:
                    self.neopixels[1] = (0, 100, 255)
                elif -5 <= exterior_temp < 0:
                    self.neopixels[1] = (0, 0, 255) if blink_state else (0, 0, 100)
                else:
                    self.neopixels[1] = (128, 0, 255) if blink_state else (50, 0, 100)
            else:
                self.neopixels[1] = (50, 50, 50)
            
            self.neopixels.show()
            
        except Exception as e:
            logger.error(f"Error actualizando LEDs: {e}")
    
    def get_led_color_name(self, temp):
        """Devuelve el nombre del color del LED para logging"""
        if temp is None:
            return "Gris"
        elif temp >= 35:
            return "Rojo Parpadeante"
        elif temp >= 30:
            return "Naranja"
        elif 26 <= temp < 30:
            return "Amarillo"
        elif 23 <= temp < 26:
            return "Verde"
        elif 18 <= temp < 23:
            return "Verde Claro"
        elif 10 <= temp < 18:
            return "Cian"
        elif 0 <= temp < 10:
            return "Azul"
        elif -5 <= temp < 0:
            return "Azul Parpadeante"
        else:
            return "Violeta Parpadeante"
    
    def get_weather_status_description(self, exterior_temp):
        """Devuelve descripción textual del estado climático"""
        if exterior_temp is None:
            return "SIN DATOS", (128, 128, 128)
        
        if exterior_temp >= 35:
            return "EXTREMO", (255, 0, 0)
        elif exterior_temp >= 30:
            return "CALUROSO", (255, 165, 0)
        elif 26 <= exterior_temp < 30:
            return "CÁLIDO", (255, 255, 0)
        elif 23 <= exterior_temp < 26:
            return "ÓPTIMO", (0, 255, 0)
        elif 18 <= exterior_temp < 23:
            return "FRESCO", (100, 255, 100)
        elif 10 <= exterior_temp < 18:
            return "FRÍO", (0, 255, 255)
        elif 0 <= exterior_temp < 10:
            return "MUY FRÍO", (0, 100, 255)
        elif -5 <= exterior_temp < 0:
            return "HELADA", (0, 0, 255)
        else:
            return "H.EXTREMA", (128, 0, 255)
    
    def draw_main_dashboard(self, data_store):
        """Dibuja la pantalla principal con todos los datos"""
        if TEST_MODE:
            # En modo prueba, usar temperatura de test
            test_temp = self.get_test_temperature()
            if test_temp is not None:
                data_store['exterior_temp'] = test_temp
                data_store['exterior_online'] = True
        
        if not TEST_MODE and not self.tft:
            return
        
        try:
            # En modo prueba, mostrar en consola en lugar de pantalla
            if TEST_MODE:
                temp = data_store.get('exterior_temp', 0)
                status, _ = self.get_weather_status_description(temp)
                logger.info(f"📱 PANTALLA: Temp={temp}°C | Estado={status}")
            else:
                # Aquí iría el código real de dibujo en la pantalla TFT
                logger.info("Actualizando pantalla TFT...")
            
        except Exception as e:
            logger.error(f"Error dibujando dashboard: {e}")
    
    def draw_stats_page(self, stats_data, system_info):
        """Dibuja la página de estadísticas"""
        if TEST_MODE:
            logger.info("📊 PÁGINA ESTADÍSTICAS: Mostrando datos del sistema")
            return
        
        if not self.tft:
            return
        
        logger.info("Página de estadísticas dibujada")
