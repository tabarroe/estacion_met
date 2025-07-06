#!/bin/bash

echo "🌡️ Instalando Estación Meteorológica TFT..."

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias del sistema
sudo apt install -y python3-pip python3-venv git

# Habilitar SPI e I2C
sudo raspi-config nonint do_spi 0
sudo raspi-config nonint do_i2c 0

# Crear directorio del proyecto
mkdir -p ~/weather_station
cd ~/weather_station

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar librerías Python
pip install --upgrade pip
pip install adafruit-circuitpython-ili9341
pip install adafruit-circuitpython-bmp280
pip install neopixel
pip install paho-mqtt
pip install psutil
pip install Pillow

# Crear directorio de logs
mkdir -p logs

# Configurar servicio systemd
sudo tee /etc/systemd/system/weather-station.service > /dev/null <<EOF
[Unit]
Description=Weather Station TFT Display
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/weather_station
ExecStart=/home/pi/weather_station/venv/bin/python /home/pi/weather_station/main.py
Restart=always
RestartSec=10
Environment=PYTHONPATH=/home/pi/weather_station

[Install]
WantedBy=multi-user.target
EOF

# Habilitar servicio
sudo systemctl enable weather-station.service

echo "✅ Instalación completada!"
echo ""
echo "Comandos útiles:"
echo "  Iniciar:     sudo systemctl start weather-station"
echo "  Detener:     sudo systemctl stop weather-station"
echo "  Ver logs:    sudo journalctl -u weather-station -f"
echo "  Estado:      sudo systemctl status weather-station"
echo ""
echo "Recuerda configurar tu token de ThingsBoard en config.py"
