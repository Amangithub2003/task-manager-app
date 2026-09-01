pipeline {
    agent any

    environment {
        REGISTRY       = "localhost:5000"
        IMAGE_NAME     = "task-manager"
        IMAGE_TAG      = "${BUILD_NUMBER}"
        MANIFESTS_REPO = "https://github.com/Amangithub2003/task-manager-manifests.git"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Test') {
            steps {
                sh 'npm ci'
                sh 'npm test'
            }
        }

        stage('Build Image') {
            steps {
                sh "docker build -t ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} ."
            }
        }

        stage('Scan Image') {
            steps {
                sh """
                    trivy image \
                    --severity HIGH,CRITICAL \
                    --exit-code 1 \
                    ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
                """
            }
        }

        stage('Push Image') {
            steps {
                sh "docker push ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }

        stage('Update Manifests Repo') {
            steps {
                sh """
                    rm -rf manifests-checkout

                    git clone ${MANIFESTS_REPO} manifests-checkout

                    cd manifests-checkout

                    sed -i 's/tag:.*/tag: "${IMAGE_TAG}"/' chart/values.yaml

                    git config user.email "jenkins@local"
                    git config user.name "jenkins"

                    git add chart/values.yaml

                    git commit -m "Update image tag to ${IMAGE_TAG}" || true

                    git push origin main
                """
            }
        }
    }

    post {
        success {
            echo "========================================="
            echo "BUILD SUCCESSFUL"
            echo "Image: ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
            echo "Manifests repository updated."
            echo "Argo CD will deploy the new image."
            echo "========================================="
        }

        failure {
            echo "========================================="
            echo "BUILD FAILED"
            echo "Check the stage logs above."
            echo "========================================="
        }
    }
}
