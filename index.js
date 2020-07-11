// Using ES6 imports
import mongoose from 'mongoose';

// Test specific import.
import { AssetDatabaseConnection, AssetDatabaseHandler } from './modules/assetdb.mjs';

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

const millisecondsToTimestring = (milliseconds) => {
    let dateObj = new Date(milliseconds);
    return dateObj.toUTCString();
}
const dbConnection = new AssetDatabaseConnection('127.0.0.1', 'priceTableDB');

const demoExchangeStream = [1594439400000,8213,8213,8206.2,8209.3,2.42610145];

const demoMultiExchangeStream = [
    [1594439700000,8209,8210,8208.8,8210,1.05564032],
    [1594440000000,8210,8210,8201.2,8201.2,0.59542547],
    [1594440300000,8201.2,8204.8,8201.2,8201.7,1.1058826],
    [1594440600000,8202.4,8202.4,8199.1,8199.9,3.97584249],
    [1594440900000,8199.9,8210,8199.9,8210,0.58222922],
    [1594441200000,8210,8210,8209.5,8209.5,1.01144376],
    [1594441500000,8209.5,8209.5,8207.4,8207.9,0.78296771],
    [1594441800000,8207.9,8211.8,8207.9,8211.8,0.96241212],
    [1594442100000,8211.8,8213.1,8211.7,8213,0.72758309],
    [1594442400000,8213,8213.1,8210.7,8210.7,1.02368606],
    [1594442700000,8210.1,8211,8210.1,8210.1,0.55879001],
    [1594443000000,8210.1,8210.1,8200,8200,3.97734539],
    [1594443300000,8200,8200.7,8200,8200.6,0.16007098],
    [1594443600000,8200.6,8204.1,8200.5,8204,1.21235726],
    [1594443900000,8204,8204,8201.2,8201.5,0.63344164],
    [1594444200000,8201.5,8207,8201.5,8206.3,0.80179439],
    [1594444500000,8206.3,8213,8206.3,8212.9,0.91845482],
    [1594444800000,8213,8213,8212.9,8213,2.0301756],
    [1594445100000,8213,8213,8212.9,8213,0.77886317],
    [1594445400000,8213,8213,8209.5,8213,3.81409721],
    [1594445700000,8210,8213,8208.9,8212,1.66349193],
    [1594446000000,8212,8213,8211.9,8213,0.99750926],
    [1594446300000,8213,8213,8212.9,8212.9,3.46691656],
    [1594446600000,8212.9,8213,8212.9,8213,1.33373183]
];

async function dbCycle(){
    try{
        let asset = new AssetDatabaseHandler();

        // try{
        //     await asset.dbSave('BTC/EUR', '5m', demoExchangeStream)
        //     console.log('DB_SAVE: Finished.');
        // }catch(error){
        //     console.log('DB_SAVE: [ERROR]', error);
        // }

        try{
            await asset.dbInsertMany('BTC/EUR', '5m', demoMultiExchangeStream)
            console.log('DB_INSERT_MANY: Finished.');
        }catch(error){
            console.log('DB_INSERT_MANY: [ERROR]', error);
        }
    }catch(failure){
        console.log('[SEVERE_FAILURE]', failure)
    }
};

(async () => {
    try{
        await dbConnection.dbConnect();
        console.log('Connected.');

        const result = await dbCycle();
        console.log('> Finished.');

    }catch(err){
        console.log('> Failed.', err);
    }finally{
        dbConnection.dbDisconnect();
        console.log('Disconnected.');
    }
})();

console.log('__END__');

// vim: fdm=marker ts=4
