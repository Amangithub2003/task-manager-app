pipeline {
    agent any

    environment {
        REGISTRY = "localhost:5000"
        IMAGE_NAME = "task-manager"
        IMAGE_TAG = "${BUILD_NUMBER}"
        MANIFESTS_REPO = "https://github.com/amangithub2003/task-manager-manifests.git"
        MANIFEST_BRANCH = "main"
    }

    stages {

        stage('Checkout SCM') {
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

                    if [ ! -f package-lock.json ]; then
                        echo "ERROR: package-lock.json not found"
                        exit 1
                    fi

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

                    echo "Image built successfully:"
                    docker images ${REGISTRY}/${IMAGE_NAME}
                '''
            }
        }

        stage('Scan Image') {
            steps {
                sh '''
                    echo "Scanning image with Trivy..."

                    trivy image \
                      --severity HIGH,CRITICAL \
                      --ignore-unfixed \
                      --exit-code 0 \
                      ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}

                    echo "Trivy scan completed."
                    echo "Vulnerabilities are reported but do not block this lab pipeline."
                '''
            }
        }

        stage('Push Image') {
            steps {
                sh '''
                    echo "Pushing image..."

                    docker push \
                      ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
                '''
            }
        }

        stage('Verify Registry') {
            steps {
                sh '''
                    echo "Verifying image in registry..."

                    curl -fsS \
                      http://${REGISTRY}/v2/${IMAGE_NAME}/tags/list

                    echo
                '''
            }
        }

        stage('Update GitOps Manifest') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'github-push',
                        usernameVariable: 'GIT_USERNAME',
                        passwordVariable: 'GIT_PASSWORD'
                    )
                ]) {

                    sh '''
                        set -e

                        echo "Cloning GitOps repository..."

                        rm -rf manifests-checkout

                        git clone \
                          --branch ${MANIFEST_BRANCH} \
                          https://${GIT_USERNAME}:${GIT_PASSWORD}@github.com/amangithub2003/task-manager-manifests.git \
                          manifests-checkout

                        cd manifests-checkout

                        echo "Current values.yaml:"
                        cat chart/values.yaml

                        echo "Updating image tag..."

                        sed -i \
                          "s|tag:.*|tag: \\"${IMAGE_TAG}\\"|" \
                          chart/values.yaml

                        echo "Updated values.yaml:"
                        cat chart/values.yaml

                        git config user.email "jenkins@local"
                        git config user.name "jenkins"

                        git add chart/values.yaml

                        if git diff --cached --quiet; then
                            echo "No manifest changes required."
                        else
                            git commit \
                              -m "Update task-manager image to ${IMAGE_TAG}"

                            git push origin ${MANIFEST_BRANCH}
                        fi
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "=========================================="
            echo "PIPELINE SUCCESS"
            echo "=========================================="
            echo "Image: ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
            echo "GitOps manifest updated."
            echo "ArgoCD should synchronize the application."
            echo "=========================================="
        }

        failure {
            echo "=========================================="
            echo "PIPELINE FAILED"
            echo "Check the failed stage above."
            echo "=========================================="
        }

        always {
            echo "Pipeline completed."
        }
    }
}
