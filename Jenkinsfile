pipeline {
    agent any

    environment {
        REGISTRY       = "localhost:5000"
        IMAGE_NAME     = "task-manager"
        IMAGE_TAG      = "${BUILD_NUMBER}"
        MANIFESTS_REPO = "https://github.com/Amangithub2003/task-manager-manifests.git"
        GIT_CREDENTIALS = "github-creds"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Test') {
            steps {
                sh '''
                    echo "Node version:"
                    node --version

                    echo "NPM version:"
                    npm --version

                    echo "Installing dependencies..."
                    npm ci

                    echo "Running tests..."
                    npm test
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    echo "Building Docker image..."

                    docker build \
                        -t ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} \
                        .

                    echo "Image created:"
                    docker images | grep task-manager
                '''
            }
        }

        stage('Scan Image') {
            steps {
                sh '''
                    echo "Scanning image with Trivy..."

                    trivy image \
                        --severity HIGH,CRITICAL \
                        --exit-code 1 \
                        ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
                '''
            }
        }

        stage('Push Image') {
            steps {
                sh '''
                    echo "Pushing image to local registry..."

                    docker push ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}

                    echo "Registry contents:"
                    curl -s http://localhost:5000/v2/_catalog
                '''
            }
        }

        stage('Update GitOps Manifest') {
            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId: "${GIT_CREDENTIALS}",
                        usernameVariable: 'GITHUB_USER',
                        passwordVariable: 'GITHUB_TOKEN'
                    )
                ]) {

                    sh '''
                        echo "Cloning manifests repository..."

                        rm -rf manifests-checkout

                        git clone \
                            https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/Amangithub2003/task-manager-manifests.git \
                            manifests-checkout

                        cd manifests-checkout

                        echo "Current image configuration:"
                        grep -n "repository\\|tag" chart/values.yaml || true

                        echo "Updating image tag..."

                        sed -i "s/^ *tag:.*/tag: \\"${IMAGE_TAG}\\"/" chart/values.yaml

                        echo "New image configuration:"
                        grep -n "repository\\|tag" chart/values.yaml

                        git config user.email "jenkins@local"
                        git config user.name "Jenkins"

                        git add chart/values.yaml

                        if git diff --cached --quiet; then
                            echo "No manifest changes required."
                        else
                            git commit -m "Update task-manager image to ${IMAGE_TAG}"

                            git push \
                                https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/Amangithub2003/task-manager-manifests.git \
                                main
                        fi
                    '''
                }
            }
        }
    }

    post {

        success {
            echo """
            ==========================================
            BUILD SUCCESSFUL
            ==========================================
            Image:
            ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}

            Image pushed to local registry.

            GitOps manifest updated.

            ArgoCD will synchronize the application.
            ==========================================
            """
        }

        failure {
            echo """
            ==========================================
            BUILD FAILED
            ==========================================
            Check the failed stage above.
            ==========================================
            """
        }

        always {
            sh '''
                echo "Docker images:"
                docker images | grep task-manager || true
            '''
        }
    }
}
