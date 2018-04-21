// Schemas define the property names and types for different punchfile versions.

exports.V1 = {
  updated: Number,
  punches: [
    {
      project: String,
      in: Number,
      out: Number,
      rewind: Number,
      comment: [String, null, undefined]
    }
  ]
}

exports.V2 = {
  created: Number,
  updated: Number,
  punches: [
    {
      project: String,
      in: Number,
      out: Number,
      rewind: Number,
      comments: [String]
    }
  ]
}

exports.V3 = {
  version: 3,
  created: Number,
  updated: Number,
  punches: [
    {
      project: String,
      in: Number,
      out: Number,
      rate: Number, // Hourly rate
      comments: [
        { timestamp: Number, comment: String }
      ]
    }
  ]
}