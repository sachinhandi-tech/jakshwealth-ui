#!/usr/bin/groovy

def props

def jakshAws(Closure body) {
    def credId = env.AWS_CREDENTIALS_ID?.trim()
    def profile = env.AWS_PROFILE ?: 'jakshwealth'
    def awsEnv = [
        "AWS_DEFAULT_REGION=${env.AWS_REGION}",
        "AWS_REGION=${env.AWS_REGION}",
        "AWS_PROFILE=${profile}"
    ]

    if (credId) {
        withCredentials([[
            $class: 'AmazonWebServicesCredentialsBinding',
            credentialsId: credId,
            accessKeyVariable: 'AWS_ACCESS_KEY_ID',
            secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
        ]]) {
            withEnv(awsEnv) {
                sh """
                    mkdir -p "\${HOME}/.aws"
                    cat > "\${HOME}/.aws/credentials" <<EOF
[${profile}]
aws_access_key_id=\${AWS_ACCESS_KEY_ID}
aws_secret_access_key=\${AWS_SECRET_ACCESS_KEY}
EOF
                """
                body()
            }
        }
    } else {
        withEnv(awsEnv) {
            body()
        }
    }
}

pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        S3_BUCKET_PREFIX = 'jakshwealth-ui'
    }

    stages {
        stage('Set environment') {
            steps {
                script {
                    props = readProperties file: "${WORKSPACE}/.cicd/build_props/build.properties"
                    env.AWS_CREDENTIALS_ID = (props.aws_credentials_id ?: '').trim()
                    env.AWS_PROFILE = props.aws_profile ?: 'jakshwealth'
                    env.AWS_REGION = props.aws_region ?: 'ap-south-2'
                    env.DEPLOY_ENV = props.deploy_env ?: 'dev'
                }
            }
        }

        stage('Build Angular app') {
            steps {
                sh """
                    export NPM_CONFIG_CACHE="${WORKSPACE}/.npm"
                    npm ci
                    npm run buildDev
                """
            }
        }

        stage('Deploy to S3') {
            steps {
                script {
                    jakshAws {
                        sh '''
                            aws sts get-caller-identity
                            aws s3 sync dist/browser/. "s3://${S3_BUCKET_PREFIX}-${DEPLOY_ENV}/" --delete
                        '''
                    }
                }
            }
        }

        stage('Invalidate CloudFront') {
            steps {
                script {
                    jakshAws {
                        sh '''
                            CF_ID=$(aws cloudfront list-distributions \
                              --query "DistributionList.Items[*].{id:Id,origin:Origins.Items[0].Id}[?origin=='S3-${S3_BUCKET_PREFIX}-${DEPLOY_ENV}'].id" \
                              --output text)
                            if [ -n "${CF_ID}" ] && [ "${CF_ID}" != "None" ]; then
                              aws cloudfront create-invalidation --distribution-id "${CF_ID}" --paths "/*"
                            else
                              echo "No CloudFront distribution found; skipping invalidation."
                            fi
                        '''
                    }
                }
            }
        }
    }
}
