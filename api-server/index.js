const express = require('express');
const { generateSlug } = require('random-word-slugs');
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs');
const{ Server } =  require('socket.io')
const redis = require('redis')

const app = express();
const PORT = 9000;

const io = new Server({cors: '*'})

io.listen(9002, ()=> console.log('Socket Server 9002'))

io.on('connection', socket =>{
    socket.on('subscribe', channel => {
        socket.join(channel)
        socket.emit('message', `Joined ${channel}`)
    })
})

const ecsClient = new ECSClient({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: '',
        secretAccessKey: '',
    }
});

const config = {
    CLUSTER: 'Cluster URL',
    TASK: 'Task Definition URL',
};

app.use(express.json());

app.post('/project', async (req, res) => {
    const { gitURL, slug } = req.body;
    const projectSlug = slug ? slug :generateSlug();

    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: [
                    '', // Replace with your subnet IDs
                    '',
                    ''
                ],
                securityGroups: ['sg-0a1b04a269b8919fa'] // Replace with your security group IDs
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: 'builder-image', // Replace with your container name
                    environment: [
                        { name: 'GIT_REPOSITORY_URL', value: gitURL },
                        { name: 'PROJECT_ID', value: projectSlug }
                    ]
                }
            ]
        }
    });

    try {
        const response = await ecsClient.send(command);
        console.log('ECS Response:', response);
        return res.json({
            status: 'queued',
            data: {
                projectSlug,
                url: `http://${projectSlug}.localhost:8000`
            }
        });
    } catch (error) {
        console.error('ECS Command Error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to run ECS task',
            error: error.message
        });
    }
});

async function initRedisSubscribe(){
    const subscriber = redis.createClient({
        url: ""
    }).on('error', err => console.log('Redis Client Error', err)).on("connect", () => console.log("redis connected"));
    await subscriber.connect();
    console.log('Subscribed to logs' )    
    subscriber.pSubscribe('logs:*')
    subscriber.on('pmessage', (pattern, channel, message) =>{
        io.to(channel).emit('message', message)
    })
}

initRedisSubscribe()
app.listen(PORT, () => console.log(`API Server Running ${PORT}`));
