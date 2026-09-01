pipeline {
    agent any

    environment {
        REGISTRY        = "localhost:5000"
        IMAGE_NAME      = "task-manager"
        IMAGE_TAG       = "${env.BUILD_NUMBER}"
        MANIFESTS_REPO  = "https://github.com/<your-username>/task-manager-manifests.git"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Test') {
            steps {
                dir('app') {
                    sh 'npm ci'
                    sh 'npm test'
                }
            }
        }

        stage('Build Image') {
            steps {
                dir('app') {
                    sh "docker build -t ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} ."
                }
            }
        }

        stage('Scan Image') {
            steps {
                // Requires trivy installed on the Jenkins agent/container.
                // Fails the build on HIGH/CRITICAL vulnerabilities.
                sh "trivy image --severity HIGH,CRITICAL --exit-code 1 ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }

        stage('Push Image') {
            steps {
                sh "docker push ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }

        stage('Update Manifests Repo (GitOps trigger)') {
            steps {
                sh """
                    rm -rf manifests-checkout
                    git clone ${MANIFESTS_REPO} manifests-checkout
                    cd manifests-checkout
                    sed -i "s|tag: .*|tag: \\"${IMAGE_TAG}\\"|" chart/values.yaml
                    git config user.email "jenkins@local"
                    git config user.name "jenkins"
                    git commit -am "Update image tag to ${IMAGE_TAG}"
                    git push origin main
                """
            }
        }
    }

    post {
        success {
            echo "Build ${IMAGE_TAG} pushed and manifests repo updated. ArgoCD will sync automatically."
        }
        failure {
            echo "Pipeline failed — check test/scan logs above."
        }
    }
}
