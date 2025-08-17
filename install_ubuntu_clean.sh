#!/bin/bash

# AGASEN - Script de Instalação Automática para Ubuntu/Debian
# Execute com: chmod +x install_ubuntu_clean.sh && ./install_ubuntu_clean.sh

set -e

echo "=== AGASEN - Instalação Automática para Ubuntu/Debian ==="

# Atualizar sistema
echo "Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
echo "Instalando dependências básicas..."
sudo apt install -y curl wget git build-essential

# Instalar Node.js 18.x
echo "Instalando Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar versões
echo "Verificando versões instaladas..."
node --version
npm --version

# Instalar PM2 globalmente
echo "Instalando PM2..."
sudo npm install -g pm2

# Instalar Nginx
echo "Instalando Nginx..."
sudo apt install -y nginx

# Instalar Certbot para SSL
echo "Instalando Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Configurar Firewall
echo "Configurando firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000

# Iniciar serviços
echo "Iniciando serviços..."
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl start ufw
sudo systemctl enable ufw

echo "=== Instalação concluída! ==="
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"
echo "PM2: $(pm2 --version)"
echo "Nginx: $(nginx -v 2>&1)"

echo ""
echo "Próximos passos:"
echo "1. Execute: git clone [seu-repositorio]"
echo "2. Configure as variáveis de ambiente"
echo "3. Execute o script de deployment"