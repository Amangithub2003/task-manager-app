pipeline {
    agent any

    environment {
        REGISTRY       = "localhost:5000"
        IMAGE_NAME     = "task-manager"
        IMAGE_TAG      = "${BUILD_NUMBER}"

        // CHANGE THIS to your actual GitHub manifests repository
        MANIFESTS_REPO = "https://github.com/amangithub2003/task-manager-manifests.git"

        MANIFEST_BRANCH = "main"
    }

    stages {

        stage('Checkout SCM') {
            steps {
                echo "Checking out application source code..."
                checkout scm
            }
        }

        stage('Checkout') {
            steps {
                echo "Application source checked out successfully."
                sh '''
                    echo "Current directory:"
                    pwd

                    echo "Files:"
                    ls -la

                    echo "Node version:"
                    node --version

                    echo "NPM version:"
                    npm --version

                    echo "Git version:"
                    git --version
                '''
            }
        }

        stage('Install & Test') {
            steps {
                echo "Installing dependencies and running tests..."

                sh '''
                    if [ ! -f package-lock.json ]; then
                        echo "ERROR: package-lock.json not found"
                        exit 1
                    fi

                    npm ci
                    npm test
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image..."

                sh '''
                    docker build \
                      -t ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} \
                      .

                    echo "Built image:"
                    docker images ${REGISTRY}/${IMAGE_NAME}
                '''
            }
        }

        stage('Scan Image') {
            steps {
                echo "Scanning image with Trivy..."

                sh '''
                    trivy image \
                      --severity HIGH,CRITICAL \
                      --ignore-unfixed \
                      --exit-code 0 \
                      ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
                '''

                echo "Trivy scan completed."
                echo "Vulnerabilities are reported but are not blocking this lab pipeline."
            }
        }

        stage('Push Image') {
            steps {
                echo "Pushing image to local Docker registry..."

                sh '''
                    docker push ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
                '''
            }
        }

        stage('Verify Registry') {
            steps {
                echo "Verifying image in registry..."

                sh '''
                    curl -fsS http://${REGISTRY}/v2/${IMAGE_NAME}/tags/list
                    echo
                '''
            }
        }

        stage('Update GitOps Manifest') {
            steps {
                echo "Updating GitOps repository..."

                sh '''
                    rm -rf manifests-checkout

                    git clone \
                      --branch ${MANIFEST_BRANCH} \
                      ${MANIFESTS_REPO} \
                      manifests-checkout

                    cd manifests-checkout

                    echo "Current values.yaml:"
                    cat chart/values.yaml

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
                        git commit -m "Update task-manager image to ${IMAGE_TAG}"
                        git push origin ${MANIFEST_BRANCH}
                    fi
                '''
            }
        }
    }

    post {

        success {
            echo """
            ==========================================
            PIPELINE SUCCESS
            ==========================================

            Image:
            ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}

            Registry:
            ${REGISTRY}

            GitOps manifest updated.

            ArgoCD should detect the manifest
            change and synchronize the application.
            ==========================================
            """
        }

        failure {
            echo """
            ==========================================
            PIPELINE FAILED
            ==========================================

            Check the failed stage above.
            ==========================================
            """
        }

        always {
            echo "Pipeline completed."
        }
    }
}
