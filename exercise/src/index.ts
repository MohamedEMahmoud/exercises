import mongoose from 'mongoose';
import { natsWrapper } from "./nats-wrapper";
import { app } from './app';
import { UserCreatedListener } from "./events/listener/user-created-listener";
import { UserUpdatedListener } from "./events/listener/user-updated-listener";
import { UserDeletedListener } from "./events/listener/user-deleted-listener";
import { v2 as Cloudinary } from "cloudinary";
const start = async () => {
    const Environment = ['MONGO_URI', "JWT_KEY", "NATS_CLUSTER_ID", "NATS_CLIENT_ID", "NATS_URL", "CLOUDINARY_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
    Environment.forEach(el => {
        if (!process.env[el]) {
            throw new Error(`${el} Must Be Defined`);
        }
    });

    try {
        await natsWrapper.connect(process.env.NATS_CLUSTER_ID!, process.env.NATS_CLIENT_ID!, process.env.NATS_URL!);
        natsWrapper.client.on("close", () => {
            console.log("NATS connection closed! from Exercise service");
            process.exit();
        });
        process.on("SIGINT", () => natsWrapper.client.close());
        process.on("SIGTERM", () => natsWrapper.client.close());

        new UserCreatedListener(natsWrapper.client).listen();
        new UserUpdatedListener(natsWrapper.client).listen();
        new UserDeletedListener(natsWrapper.client).listen();

        await mongoose.connect(process.env.MONGO_URI!, { useNewUrlParser: true, useUnifiedTopology: true } as mongoose.ConnectOptions);
        mongoose.Promise = global.Promise;
        console.log('Connection to Mongodb Successfully!');

        Cloudinary.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });


    }

    catch (e) {
        console.log(e);
    }

    const PORT = 3000 || process.env.PORT;
    app.listen(PORT, () => console.log(`Server Listening On Port ${PORT} From Run Service`));
};

start();