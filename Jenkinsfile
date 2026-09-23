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
                echo 'Building Docker image...'

                bat 'docker build -t %IMAGE% .'

                echo 'Docker image built successfully.'
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

                        error(
                            "Could not determine active environment. " +
                            "Detected value: [${active}]"
                        )
                    }

                    echo "Currently active environment: ${active}"
                    echo "New deployment target: ${env.TARGET_ENV}"
                    echo "Deployment port: ${env.TARGET_PORT}"
                    echo "Target container: ${env.TARGET_CONTAINER}"

                    echo '=========================================='
                }
            }
        }

        stage('Deploy New Environment') {
            steps {

                echo '=========================================='
                echo "       DEPLOYING ${env.TARGET_ENV}"
                echo '=========================================='

                bat '''
                docker rm -f %TARGET_CONTAINER% 2>NUL || exit /b 0

                docker run -d ^
                    --name %TARGET_CONTAINER% ^
                    -p %TARGET_PORT%:3000 ^
                    -e VERSION=%TARGET_ENV% ^
                    %IMAGE%
                '''

                echo "${env.TARGET_ENV} environment deployed successfully."
            }
        }

        stage('Test New Environment') {
            steps {

                echo '=========================================='
                echo "       TESTING ${env.TARGET_ENV}"
                echo '=========================================='

                bat '''
                timeout /t 5 /nobreak

                curl.exe -f http://localhost:%TARGET_PORT%/status
                '''

                echo "${env.TARGET_ENV} environment test successful."
            }
        }

        stage('Switch Traffic') {
            steps {

                echo '=========================================='
                echo "   SWITCHING TRAFFIC TO ${env.TARGET_ENV}"
                echo '=========================================='

                bat '''
                powershell -NoProfile -Command "$c=Get-Content nginx.conf; $c=$c -replace 'host.docker.internal:\\d+','host.docker.internal:%TARGET_PORT%'; Set-Content nginx.conf $c"

                docker restart %NGINX_CONTAINER%
                '''

                echo "Traffic has been switched to ${env.TARGET_ENV}."
            }
        }

        stage('Verify Deployment') {
            steps {

                echo '=========================================='
                echo '       VERIFYING DEPLOYMENT'
                echo '=========================================='

                bat '''
                timeout /t 3 /nobreak

                curl.exe -f http://localhost:8090/status
                '''

                echo "Traffic successfully verified through Nginx."
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

            echo 'The previous environment remains available for rollback.'

            echo '=========================================='
        }

        failure {

            echo '=========================================='
            echo '   BLUE-GREEN DEPLOYMENT FAILED!'
            echo '=========================================='

            echo 'The previous environment remains available for rollback.'

            echo '=========================================='
        }
    }
}