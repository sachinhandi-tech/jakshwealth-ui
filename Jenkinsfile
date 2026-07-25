#!/usr/bin/groovy

def props

/** Run closure with AWS keys from Jenkins credential store (ID: jakshwealth-aws). */
def jakshAws(Closure body) {
    withCredentials([[
        $class: 'AmazonWebServicesCredentialsBinding',
        credentialsId: env.AWS_CREDENTIALS_ID,
        accessKeyVariable: 'AWS_ACCESS_KEY_ID',
        secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
    ]]) {
        withEnv([
            "AWS_DEFAULT_REGION=${env.AWS_REGION}",
            "AWS_REGION=${env.AWS_REGION}",
            'AWS_PROFILE=jakshwealth'
        ]) {
            sh '''
                mkdir -p "${HOME}/.aws"
                cat > "${HOME}/.aws/credentials" <<EOF
[jakshwealth]
aws_access_key_id=${AWS_ACCESS_KEY_ID}
aws_secret_access_key=${AWS_SECRET_ACCESS_KEY}
EOF
            '''
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
                    if (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'master') {
                        props = readProperties file: "${WORKSPACE}/.cicd/build_props/prod-build.properties"
                    } else if (env.BRANCH_NAME == 'test') {
                        props = readProperties file: "${WORKSPACE}/.cicd/build_props/test-build.properties"
                    } else {
                        props = readProperties file: "${WORKSPACE}/.cicd/build_props/dev-build.properties"
                    }
                    env.AWS_CREDENTIALS_ID = props.aws_credentials_id ?: 'jakshwealth-aws'
                    env.AWS_REGION = props.aws_region ?: 'us-east-1'
                    env.DEPLOY_ENV = props.deploy_env
                }
            }
        }

        stage('Build Angular app') {
            steps {
                script {
                    def buildTarget = "build${env.DEPLOY_ENV.capitalize()}"
                    sh """
                        export NPM_CONFIG_CACHE="${WORKSPACE}/.npm"
                        npm ci
                        npm run ${buildTarget}
                    """
                }
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
