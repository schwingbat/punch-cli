# Invoicing

Invoices can be generated in multiple formats. Each format is defined as a function that takes invoice data and an output path and returns a `Promise`:

`function (config: object, data: InvoiceData, outputPath: string): Promise<void>`

## InvoiceData

An `InvoiceData` object is this:

```js
{
  template: string, // name of a template: ./assets/templates/{{template}}.hbs
  project: { ... }, // config.projects entry
  user: { ... },// config.user entry 
  client: { ... }, // config.clients entry
  start: Date, // start of the invoice period
  end: Date, // end of the invoice period
  today: Date, // today's date
  totalPay: number, // total money earned during the invoice period
  totalTime: number // total time spent during the invoice period in milliseconds
  days: [ // breakdown of totals and comments by day
    {
      date: Date,
      time: number,
      pay: number,
      comments: string[]
    },
    ...
  ],
}
```