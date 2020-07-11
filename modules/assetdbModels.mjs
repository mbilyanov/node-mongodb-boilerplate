// Using ES6 imports
import mongoose from 'mongoose';

//Define a schema
var Schema = mongoose.Schema;

var AssetSchema = new mongoose.Schema({
    asset: String,
    timeframe: String,
    stream: [
        {type: Number},
        Schema.Types.Decimal128,
        Schema.Types.Decimal128,
        Schema.Types.Decimal128,
        Schema.Types.Decimal128,
        {type: Schema.Types.Decimal128, min: 0.0},
    ],
    date: {
        type: Date,
        unique: true,
        required: true,
    }
});

const AssetDatabaseModel = (timeframe) => {
    var AssetModel = mongoose.model(timeframe, AssetSchema);
    return AssetModel;
}

export { AssetDatabaseModel };

// vim: fdm=marker ts=4
