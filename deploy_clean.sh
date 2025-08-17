#!/bin/bash

# AGASEN - Script de Deployment
# Execute com: chmod +x deploy_clean.sh && ./deploy_clean.sh

set -e

echo "=== AGASEN - Script de Deployment ==="

# Configurações
PROJECT_NAME="agasen"
PROJECT_DIR="/var/www/$PROJECT_NAME"
DOMAIN="seu-dominio.com"  # Altere para seu domínio
USER=$(whoami)

# Solicitar URL do repositório se não estiver definida
if [ -z "$REPO_URL" ]; then
    read -p "Digite a URL do repositório Git: " REPO_URL
fi

# Solicitar domínio se não estiver definido
read -p "Digite seu domínio (ex: meusite.com): " DOMAIN

# Criar diretório do projeto
echo "Criando diretório do projeto..."
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR

# Clonar ou atualizar repositório
if [ -d "$PROJECT_DIR/.git" ]; then
    echo "Atualizando repositório..."
    cd $PROJECT_DIR
    git pull origin main
else
    echo "Clonando repositório..."
    git clone $REPO_URL $PROJECT_DIR
    cd $PROJECT_DIR
fi

# Instalar dependências
echo "Instalando dependências..."
npm install

# Build da aplicação
echo "Construindo aplicação..."
npm run build

# Configurar Nginx
echo "Configurando Nginx..."
sudo tee /etc/nginx/sites-available/$PROJECT_NAME > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    root $PROJECT_DIR/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Ativar site no Nginx
sudo ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Configurar SSL com Let's Encrypt
echo "Configurando SSL..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Configurar PM2 (se houver backend)
if [ -f "server.js" ] || [ -f "index.js" ]; then
    echo "Configurando PM2..."
    pm2 delete $PROJECT_NAME 2>/dev/null || true
    pm2 start npm --name $PROJECT_NAME -- start
    pm2 save
    pm2 startup
fi

echo "=== Deployment concluído! ==="
echo "Site disponível em: https://$DOMAIN"
echo ""
echo "Comandos úteis:"
echo "- Ver logs do Nginx: sudo tail -f /var/log/nginx/error.log"
echo "- Recarregar Nginx: sudo systemctl reload nginx"
echo "- Ver status PM2: pm2 status"
echo "- Ver logs PM2: pm2 logs $PROJECT_NAME"