# AGASEN - Coletor - Requisitos para VPS

## Requisitos do Sistema

### Sistema Operacional Suportado
- **Ubuntu 20.04 LTS ou superior** (Recomendado)
- **CentOS 8+ / RHEL 8+**
- **Debian 11+**

### Especificações Mínimas do Servidor
- **CPU**: 2 vCPUs
- **RAM**: 4GB
- **Armazenamento**: 20GB SSD
- **Largura de Banda**: 100 Mbps

## Dependências Obrigatórias

### 1. Node.js e NPM
```bash
# Versão requerida: Node.js 18.x ou superior
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar versões
node --version  # Deve ser >= 18.0.0
npm --version   # Deve ser >= 8.0.0
```

### 2. Git
```bash
sudo apt update
sudo apt install git -y
```

### 3. Nginx (Servidor Web)
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 4. PM2 (Gerenciador de Processos)
```bash
npm install -g pm2
pm2 startup
```

### 5. Certbot (SSL/HTTPS)
```bash
sudo apt install snapd -y
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

## Dependências Opcionais (Para Build Mobile)

### 6. Java JDK (Para Capacitor Android)
```bash
sudo apt install openjdk-11-jdk -y
echo 'export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64' >> ~/.bashrc
source ~/.bashrc
```

### 7. Android SDK (Para Capacitor Android)
```bash
# Download Android Command Line Tools
wget https://dl.google.com/android/repository/commandlinetools-linux-8512546_latest.zip
unzip commandlinetools-linux-8512546_latest.zip
mkdir -p ~/Android/Sdk/cmdline-tools/latest
mv cmdline-tools/* ~/Android/Sdk/cmdline-tools/latest/
echo 'export ANDROID_HOME=~/Android/Sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin' >> ~/.bashrc
source ~/.bashrc
```

## Configuração do Firewall

### 8. UFW (Uncomplicated Firewall)
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000  # Para desenvolvimento (opcional)
```

## Scripts de Instalação Automatizada

### Para Ubuntu/Debian
```bash
#!/bin/bash
# install_ubuntu.sh

set -e

echo "🚀 Instalando dependências para AGASEN - Coletor..."

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
sudo apt install -y curl wget git build-essential

# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar Nginx
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Instalar PM2
npm install -g pm2

# Configurar PM2 para inicialização automática
pm2 startup

# Instalar Certbot
sudo apt install -y snapd
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Configurar Firewall
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Instalar Java (para Capacitor)
sudo apt install -y openjdk-11-jdk

echo "✅ Instalação concluída!"
echo "📋 Próximos passos:"
echo "1. Clone o repositório: git clone <seu-repo>"
echo "2. Entre na pasta: cd <nome-do-projeto>"
echo "3. Instale dependências: npm install"
echo "4. Execute o build: npm run build"
echo "5. Configure o Nginx (veja nginx.conf abaixo)"
```

### Para CentOS/RHEL
```bash
#!/bin/bash
# install_centos.sh

set -e

echo "🚀 Instalando dependências para AGASEN - Coletor (CentOS/RHEL)..."

# Atualizar sistema
sudo dnf update -y

# Instalar dependências básicas
sudo dnf install -y curl wget git gcc-c++ make

# Instalar Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Instalar Nginx
sudo dnf install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Instalar PM2
npm install -g pm2

# Configurar PM2 para inicialização automática
pm2 startup

# Instalar snapd e Certbot
sudo dnf install -y epel-release
sudo dnf install -y snapd
sudo systemctl enable --now snapd.socket
sudo ln -s /var/lib/snapd/snap /snap
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot

# Configurar Firewall
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# Instalar Java (para Capacitor)
sudo dnf install -y java-11-openjdk-devel

echo "✅ Instalação concluída!"
```

## Configurações Necessárias

### 9. Configuração do Nginx
```nginx
# /etc/nginx/sites-available/agasen-coletor
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    root /var/www/agasen-coletor/dist;
    index index.html;

    # Configuração para SPA (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### 10. Configuração do PM2
```json
{
  "name": "agasen-coletor",
  "script": "serve",
  "args": "-s dist -l 3000",
  "instances": 1,
  "autorestart": true,
  "watch": false,
  "max_memory_restart": "1G",
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 11. Variáveis de Ambiente
```bash
# .env.production
VITE_SUPABASE_URL=https://mxoflglqsxupkzrbodkm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14b2ZsZ2xxc3h1cGt6cmJvZGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NjM1MzgsImV4cCI6MjA3MDUzOTUzOH0.zToDlCEsT7TCAnQslnFVRRiygRveOCXf33TAuG_tdF8
```

## Processo de Deploy

### 12. Script de Deploy
```bash
#!/bin/bash
# deploy.sh

set -e

PROJECT_DIR="/var/www/agasen-coletor"
REPO_URL="https://github.com/seu-usuario/agasen-coletor.git"

echo "🚀 Iniciando deploy..."

# Clone ou atualizar repositório
if [ -d "$PROJECT_DIR" ]; then
    cd $PROJECT_DIR
    git pull origin main
else
    git clone $REPO_URL $PROJECT_DIR
    cd $PROJECT_DIR
fi

# Instalar dependências
npm install

# Build do projeto
npm run build

# Copiar arquivos estáticos
sudo cp -r dist/* /var/www/agasen-coletor/

# Ativar site no Nginx
sudo ln -sf /etc/nginx/sites-available/agasen-coletor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Configurar SSL (se domínio configurado)
# sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

echo "✅ Deploy concluído!"
```

## Verificação da Instalação

### 13. Comandos de Verificação
```bash
# Verificar versões
node --version
npm --version
nginx -v
pm2 --version

# Verificar serviços
sudo systemctl status nginx
sudo systemctl status ufw

# Verificar portas
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Testar Nginx
curl -I http://localhost
```

## Logs e Monitoramento

### 14. Localização dos Logs
```bash
# Logs do Nginx
/var/log/nginx/access.log
/var/log/nginx/error.log

# Logs do PM2
~/.pm2/logs/

# Logs do sistema
/var/log/syslog
```

### 15. Comandos Úteis de Monitoramento
```bash
# Monitorar logs em tempo real
sudo tail -f /var/log/nginx/access.log
pm2 logs

# Status dos serviços
pm2 status
sudo systemctl status nginx

# Uso de recursos
htop
df -h
free -h
```

## Troubleshooting

### Problemas Comuns
1. **Porta 80/443 já em uso**: `sudo lsof -i :80`
2. **Permissões de arquivo**: `sudo chown -R www-data:www-data /var/www/agasen-coletor`
3. **Firewall bloqueando**: `sudo ufw status verbose`
4. **SSL não funcionando**: `sudo certbot certificates`

### Comandos de Backup
```bash
# Backup do projeto
tar -czf agasen-backup-$(date +%Y%m%d).tar.gz /var/www/agasen-coletor

# Backup da configuração do Nginx
sudo cp /etc/nginx/sites-available/agasen-coletor ~/nginx-backup.conf
```

---

## 📝 Checklist de Instalação

- [ ] Sistema operacional atualizado
- [ ] Node.js 18+ instalado
- [ ] Git instalado
- [ ] Nginx instalado e funcionando
- [ ] PM2 instalado globalmente
- [ ] Firewall configurado (UFW)
- [ ] Certbot instalado
- [ ] Java JDK instalado (se usar Capacitor)
- [ ] Projeto clonado e dependencies instaladas
- [ ] Build do projeto executado
- [ ] Nginx configurado para servir a aplicação
- [ ] SSL configurado (se necessário)
- [ ] Domínio apontado para o servidor (se aplicável)

---

**🎯 Para execução rápida, execute o script de instalação apropriado para seu SO e siga o checklist acima.**