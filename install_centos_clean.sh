#!/bin/bash

# AGASEN - Script de Instalação Automática para CentOS/RHEL
# Execute com: chmod +x install_centos_clean.sh && ./install_centos_clean.sh

set -e

echo "=== AGASEN - Instalação Automática para CentOS/RHEL ==="

# Atualizar sistema
echo "Atualizando sistema..."
sudo yum update -y

# Instalar dependências básicas
echo "Instalando dependências básicas..."
sudo yum groupinstall -y "Development Tools"
sudo yum install -y curl wget git

# Instalar Node.js 18.x
echo "Instalando Node.js 18.x..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verificar versões
echo "Verificando versões instaladas..."
node --version
npm --version

# Instalar PM2 globalmente
echo "Instalando PM2..."
sudo npm install -g pm2

# Instalar Nginx
echo "Instalando Nginx..."
sudo yum install -y nginx

# Instalar Certbot para SSL
echo "Instalando Certbot..."
sudo yum install -y certbot python3-certbot-nginx

# Configurar Firewall
echo "Configurando firewall..."
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# Iniciar serviços
echo "Iniciando serviços..."
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl start firewalld
sudo systemctl enable firewalld

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