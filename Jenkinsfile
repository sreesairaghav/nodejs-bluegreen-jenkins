pipeline {
    agent any

    environment {
        IMAGE = 'sreesairaghav13/nodejs-bluegreen:latest'
        BLUE_CONTAINER = 'blue-app'
        GREEN_CONTAINER = 'green-app'
        NGINX_CONTAINER = 'bg-nginx'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t %IMAGE% .'
            }
        }

        stage('Deploy Green') {
            steps {
                bat '''
                docker rm -f %GREEN_CONTAINER% 2>NUL || exit /b 0
                docker run -d --name %GREEN_CONTAINER% -p 3002:3000 -e VERSION=GREEN %IMAGE%
                '''
            }
        }

        stage('Test Green') {
            steps {
                bat '''
                timeout /t 5 /nobreak
                curl -f http://localhost:3002/status
                '''
            }
        }

        stage('Switch Traffic to Green') {
            steps {
                bat '''
                powershell -Command "(Get-Content nginx.conf) -replace 'host.docker.internal:3001', 'host.docker.internal:3002' | Set-Content nginx.conf"
                docker restart %NGINX_CONTAINER%
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                bat '''
                timeout /t 3 /nobreak
                curl -f http://localhost:8090/status
                '''
            }
        }

        stage('Deployment Status') {
            steps {
                bat 'docker ps'
            }
        }
    }

    post {
        success {
            echo 'BLUE-GREEN DEPLOYMENT SUCCESSFUL!'
            echo 'Traffic has been switched from Blue to Green.'
        }

        failure {
            echo 'BLUE-GREEN DEPLOYMENT FAILED!'
            echo 'Blue environment remains available for rollback.'
        }
    }
}