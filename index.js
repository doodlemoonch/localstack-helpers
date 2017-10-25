const stream = require('stream');
const Docker = require('dockerode');
const _ = require('lodash');

const docker = new Docker();

function start() {
    return new Promise((resolve) => {
        let ready = false;
        const logs = [];
        const logStream = new stream.PassThrough();

        logStream.on('data', (chunk) => {
            const log = chunk.toString('utf8');
            logs.push(log);
            if (log.includes('Ready.')) {
                ready = true;
            }
        });

        setInterval(() => {
            if (ready) {
                setTimeout(() => resolve(), 2000);
            }
            return false;
        }, 50);

        docker.run('localstack/localstack', [], logStream, { Env: ['SERVICES=sqs,s3', 'DEFAULT_REGION=eu-west-2'], ExposedPorts: { '4576/tcp': {}, '4572/tcp': {} }, HostConfig: { PortBindings: { '4576/tcp': [{ HostPort: '4576' }], '4572/tcp': [{ HostPort: '4572' }] } } });
    });
}

function stop() {
    return new Promise((resolve) => {
        docker.listContainers((err, containers) => {
            const localStackContainers = _.filter(containers, (c) => c.Image === 'localstack/localstack');
            if (localStackContainers.length === 0) {
                resolve();
            }
            localStackContainers.forEach(({ Id }) => {
                docker.getContainer(Id).stop()
                    .then(() => docker.getContainer(Id).remove())
                    .then(() => resolve());
            });
        });
    });
}

module.exports = {
    start, stop,
};
