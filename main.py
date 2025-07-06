"""
Programa principal de la estación meteorológica
COMPATIBLE con módulo exterior ESP32 v5
"""
import time
import json
from datetime import datetime
import psutil
from collections import deque
import paho.mqtt.client as mqtt

from config import MQTT_CONFIG, TEMP_THRESHOLDS, TEST_MODE
from logger_config import logger
from hardware_manager import HardwareManager

class WeatherStation:
    def __init__(self):
        self.hardware = HardwareManager()
        
        # Almacén de datos
        self.data_store = {
            'interior_temp': 22.5,
            'interior_humidity': 45,
            'interior_pressure': 1015,
            'exterior_temp': 20.0,
            'exterior_humidity': 65,
            'exterior_pressure': 1013,
            'exterior_feels_like': 18.5,
            'exterior_online': False,  # Inicialmente offline
            'temp_history': deque(maxlen=24),
            'last_update': time.time(),
            'last_alert_time': 0
        }
        
        # Estadísticas
        self.stats_data = {
            'day_max': 25.0,
            'day_min': 15.0,
            'day_avg': 20.0,
            'variation': 10.0
        }
        
        self.current_page = 'main'
        self.last_button_press = 0
        
        # Cliente MQTT
        self.mqtt_client = None
        
        if not TEST_MODE:
            self._setup_mqtt()
        
        logger.info("🌡️ Estación meteorológica inicializada")
        if TEST_MODE:
            logger.info("🧪 MODO PRUEBA: Ciclo de temperaturas cada 10 segundos")
    
    def _setup_mqtt(self):
        """Configura el cliente MQTT para recibir datos del ESP32"""
        try:
            self.mqtt_client = mqtt.Client()
            self.mqtt_client.on_connect = self._on_mqtt_connect
            self.mqtt_client.on_message = self._on_mqtt_message
            self.mqtt_client.on_disconnect = self._on_mqtt_disconnect
            
            # Conectar al broker
            self.mqtt_client.connect(
                MQTT_CONFIG['LOCAL_BROKER']['host'],
                MQTT_CONFIG['LOCAL_BROKER']['port'],
                60
            )
            
            # Iniciar loop en hilo separado
            self.mqtt_client.loop_start()
            
            logger.info("Cliente MQTT configurado")
            
        except Exception as e:
            logger.error(f"Error configurando MQTT: {e}")
    
    def _on_mqtt_connect(self, client, userdata, flags, rc):
        """Callback cuando se conecta al broker MQTT"""
        if rc == 0:
            logger.info("✅ Conectado al broker MQTT")
            # Suscribirse a todos los tópicos del módulo exterior
            topics = MQTT_CONFIG['LOCAL_BROKER']['topics']
            for topic_name, topic_path in topics.items():
                client.subscribe(topic_path)
                logger.info(f"📡 Suscrito a {topic_path}")
        else:
            logger.error(f"❌ Error conectando al broker MQTT: {rc}")
    
    def _on_mqtt_disconnect(self, client, userdata, rc):
        """Callback cuando se desconecta del broker"""
        logger.warning("📡 Desconectado del broker MQTT")
        self.data_store['exterior_online'] = False
    
    def _on_mqtt_message(self, client, userdata, msg):
        """Callback cuando llega un mensaje MQTT del ESP32"""
        try:
            topic = msg.topic
            payload = msg.payload.decode('utf-8')
            
            logger.info(f"📨 MQTT: {topic} = {payload}")
            
            # Procesar según el tópico
            if topic == MQTT_CONFIG['LOCAL_BROKER']['topics']['exterior_temp']:
                temp_value = float(payload)
                self.data_store['exterior_temp'] = temp_value
                self.data_store['exterior_online'] = True
                
                # Añadir a historial
                self.data_store['temp_history'].append(temp_value)
                
                # Calcular sensación térmica aproximada
                self.data_store['exterior_feels_like'] = temp_value - 2.0
                
                # Procesar alertas de temperatura
                self._process_temperature_alerts(temp_value)
                
            elif topic == MQTT_CONFIG['LOCAL_BROKER']['topics']['exterior_hum']:
                self.data_store['exterior_humidity'] = float(payload)
                
            elif topic == MQTT_CONFIG['LOCAL_BROKER']['topics']['exterior_pres']:
                self.data_store['exterior_pressure'] = float(payload)
                
            elif topic == MQTT_CONFIG['LOCAL_BROKER']['topics']['exterior_status']:
                is_online = payload.lower() == 'online'
                self.data_store['exterior_online'] = is_online
                
                if is_online:
                    logger.info("🟢 Módulo exterior ONLINE")
                else:
                    logger.warning("🔴 Módulo exterior OFFLINE")
            
            # Actualizar timestamp
            self.data_store['last_update'] = time.time()
            
        except Exception as e:
            logger.error(f"Error procesando mensaje MQTT: {e}")
    
    def _process_temperature_alerts(self, temp_value):
        """Procesa alertas de temperatura del módulo exterior"""
        current_time = time.time()
        
        # Evitar spam de alertas (mínimo 5 minutos entre alertas)
        if current_time - self.data_store['last_alert_time'] < 300:
            return
        
        if temp_value >= TEMP_THRESHOLDS['heat_warning']:
            logger.warning(f"🔥 ALERTA CALOR EXTREMO: {temp_value:.1f}°C")
            self.data_store['last_alert_time'] = current_time
            
        elif temp_value <= TEMP_THRESHOLDS['freeze_warning']:
            logger.warning(f"❄️ ALERTA HELADA: {temp_value:.1f}°C")
            self.data_store['last_alert_time'] = current_time
    
    def run(self):
        """Bucle principal del programa"""
        logger.info("🚀 Iniciando estación meteorológica...")
        logger.info(f"📡 Esperando datos del módulo exterior en {MQTT_CONFIG['LOCAL_BROKER']['host']}")
        
        last_sensor_read = 0
        last_led_update = 0
        last_display_update = 0
        last_stats_calc = 0
        
        try:
            while True:
                current_time = time.time()
                
                # Comprobar botón
                if self.hardware.is_button_pressed():
                    if current_time - self.last_button_press > 0.5:
                        self.current_page = 'stats' if self.current_page == 'main' else 'main'
                        self.last_button_press = current_time
                        logger.info(f"📱 Cambiando a página: {self.current_page}")
                
                # Leer sensor local cada 30 segundos
                if current_time - last_sensor_read > 30:
                    sensor_data = self.hardware.read_local_bmp280()
                    if sensor_data:
                        self.data_store['interior_temp'] = sensor_data['temperature']
                        self.data_store['interior_pressure'] = sensor_data['pressure']
                        logger.debug(f"🏠 Interior: {sensor_data['temperature']:.1f}°C")
                    last_sensor_read = current_time
                
                # Actualizar LEDs cada 5 segundos
                if current_time - last_led_update > 5:
                    self.hardware.update_leds(
                        self.data_store['interior_temp'],
                        self.data_store['exterior_temp'],
                        self.data_store['exterior_online'],
                        self.data_store['last_update']
                    )
                    last_led_update = current_time
                
                # Calcular estadísticas cada 5 minutos
                if current_time - last_stats_calc > 300:
                    self._calculate_stats()
                    last_stats_calc = current_time
                
                # Actualizar pantalla cada 2 segundos
                if current_time - last_display_update > 2:
                    if self.current_page == 'main':
                        self.hardware.draw_main_dashboard(self.data_store)
                    else:
                        system_info = self._get_system_info()
                        self.hardware.draw_stats_page(self.stats_data, system_info)
                    last_display_update = current_time
                
                # Verificar conexión del módulo exterior
                if current_time - self.data_store['last_update'] > 300:  # 5 minutos sin datos
                    if self.data_store['exterior_online']:
                        logger.warning("⚠️ Módulo exterior sin respuesta por 5 minutos")
                        self.data_store['exterior_online'] = False
                
                time.sleep(0.1)
                
        except KeyboardInterrupt:
            logger.info("⏹️ Deteniendo estación meteorológica...")
        finally:
            if self.mqtt_client:
                self.mqtt_client.loop_stop()
                self.mqtt_client.disconnect()
    
    def _calculate_stats(self):
        """Calcula estadísticas diarias"""
        if len(self.data_store['temp_history']) > 0:
            temps = list(self.data_store['temp_history'])
            self.stats_data['day_max'] = max(temps)
            self.stats_data['day_min'] = min(temps)
            self.stats_data['day_avg'] = sum(temps) / len(temps)
            self.stats_data['variation'] = self.stats_data['day_max'] - self.stats_data['day_min']
    
    def _get_system_info(self):
        """Obtiene información del sistema"""
        if TEST_MODE:
            return {
                'cpu_usage': 45,
                'ram_usage': 67,
                'cpu_temp': 55.0,
                'wifi_signal': 85,
                'uptime': '2d 14h 32m'
            }
        else:
            return {
                'cpu_usage': psutil.cpu_percent(),
                'ram_usage': psutil.virtual_memory().percent,
                'cpu_temp': self._get_cpu_temp(),
                'wifi_signal': 85,  # Placeholder
                'uptime': self._get_uptime()
            }
    
    def _get_cpu_temp(self):
        """Obtiene temperatura de la CPU"""
        try:
            temps = psutil.sensors_temperatures()
            if 'cpu_thermal' in temps:
                return temps['cpu_thermal'][0].current
        except:
            pass
        return 55.0
    
    def _get_uptime(self):
        """Obtiene uptime del sistema"""
        try:
            boot_time = psutil.boot_time()
            uptime_seconds = time.time() - boot_time
            days = int(uptime_seconds // 86400)
            hours = int((uptime_seconds % 86400) // 3600)
            minutes = int((uptime_seconds % 3600) // 60)
            return f"{days}d {hours}h {minutes}m"
        except:
            return "0d 0h 0m"

if __name__ == "__main__":
    station = WeatherStation()
    station.run()
