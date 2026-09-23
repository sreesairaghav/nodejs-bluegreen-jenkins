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
                echo 'Checking out Blue-Green deployment project'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t %IMAGE% .'
            }
        }

        stage('Push Docker Image') {
            steps {
                bat 'docker push %IMAGE%'
            }
        }

        stage('Detect Active Environment') {
            steps {
                script {

                    echo '=========================================='
                    echo '      DETECTING ACTIVE ENVIRONMENT'
                    echo '=========================================='

                    def active = bat(
                        script: 'powershell -NoProfile -Command "(Invoke-RestMethod http://localhost:8090/status).version"',
                        returnStdout: true
                    ).trim()

                    echo "Raw detected environment: [${active}]"

                    if (active.contains('BLUE')) {

                        env.TARGET_ENV = 'GREEN'
                        env.TARGET_PORT = '3002'
                        env.TARGET_CONTAINER = 'green-app'

                    } else if (active.contains('GREEN')) {

                        env.TARGET_ENV = 'BLUE'
                        env.TARGET_PORT = '3001'
                        env.TARGET_CONTAINER = 'blue-app'

                    } else {

                        error("Could not determine active environment. Detected: [${active}]")
                    }

                    echo "Currently active environment: ${active}"
                    echo "New deployment target: ${env.TARGET_ENV}"
                    echo "Deployment port: ${env.TARGET_PORT}"

                    echo '=========================================='
                }
            }
        }

        stage('Deploy New Environment') {
            steps {

                echo "Deploying ${env.TARGET_ENV} environment..."

                bat '''
                docker rm -f %TARGET_CONTAINER% 2>NUL || exit /b 0
                docker run -d --name %TARGET_CONTAINER% -p %TARGET_PORT%:3000 -e VERSION=%TARGET_ENV% %IMAGE%
                '''

                echo "Deployment of ${env.TARGET_ENV} completed."
            }
        }

        stage('Test New Environment') {
            steps {

                echo "Testing ${env.TARGET_ENV} on port ${env.TARGET_PORT}..."

                bat '''
                timeout /t 5 /nobreak
                curl.exe -f http://localhost:%TARGET_PORT%/status
                '''

                echo "${env.TARGET_ENV} environment test successful."
            }
        }

        stage('Switch Traffic') {
            steps {

                echo "=========================================="
                echo " SWITCHING TRAFFIC TO ${env.TARGET_ENV}"
                echo "=========================================="

                bat '''
                powershell -NoProfile -Command "$c=Get-Content nginx.conf; $c=$c -replace 'host.docker.internal:\\d+','host.docker.internal:%TARGET_PORT%'; Set-Content nginx.conf $c"

                docker restart %NGINX_CONTAINER%
                '''

                echo "Traffic has been switched to ${env.TARGET_ENV}."
            }
        }

        stage('Verify Deployment') {
            steps {

                echo "Verifying traffic through Nginx..."

                bat '''
                timeout /t 3 /nobreak
                curl.exe -f http://localhost:8090/status
                '''

                echo "Traffic verification successful."
            }
        }

        stage('Deployment Status') {
            steps {

                echo '=========================================='
                echo '        DEPLOYMENT STATUS'
                echo '=========================================='

                bat 'docker ps'

                echo '=========================================='
                echo "ACTIVE ENVIRONMENT: ${env.TARGET_ENV}"
                echo '=========================================='
            }
        }
    }

    post {

        success {
            echo '=========================================='
            echo '   BLUE-GREEN DEPLOYMENT SUCCESSFUL!'
            echo '=========================================='
            echo "Traffic has been switched to ${env.TARGET_ENV}."
            echo "Previous environment remains available for rollback."
        }

        failure {
            echo '=========================================='
            echo '   BLUE-GREEN DEPLOYMENT FAILED!'
            echo '=========================================='
            echo 'The previous environment remains available for rollback.'
        }
    }
}