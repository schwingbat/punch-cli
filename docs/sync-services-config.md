# Sync Services


## S3

```ini
{
  name "s3"
  label "Anything you want..."
  bucket "bucket-name"
  region "region-name" # us-west-2, us-east, etc

  # credentials can be a path to a separate file...
  credentials "./credentials/s3.mon"

  # ...or an object.
  credentials {
    accessKeyId "your-access-key-id"
    secretAccessKey "your-secret-key"
  }
}
```

## DigitalOcean Spaces

```ini
{
  name "spaces"
  label "Anything you want..."
  
  # can be 'bucket' or 'space'
  space "space-name"

  # use region OR endpoint - endpoint includes a region and will override the region
  region "nyc3"
  endpoint "sfo2.digitaloceanspaces.com"

  # credentials can also be a relative path to a MON file
  credentials {
    accessKeyId "your-access-key-id"
    secretAccessKey "your-secret-key"
  }
}
```