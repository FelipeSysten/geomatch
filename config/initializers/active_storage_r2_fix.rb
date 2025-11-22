# config/initializers/active_storage_r2_fix.rb

# Este código corrige o erro "Aws::S3::Errors::InvalidRequest: You can only specify one non-default checksum at a time."
# que ocorre ao usar o Active Storage com o Cloudflare R2 (ou outros serviços S3 que não suportam o checksum padrão do Rails).
# Ele desabilita o cálculo e envio do checksum no momento do upload.

Rails.application.config.to_prepare do
  if ActiveStorage::Blob.service.is_a?(ActiveStorage::Service::S3Service)
    ActiveStorage::Service::S3Service.class_eval do
      def upload(key, io, checksum: nil, **options)
        instrument :upload, key: key, checksum: checksum do
          begin
            client.put_object(
              bucket: bucket,
              key: key,
              body: io,
              content_md5: checksum,
              content_type: options[:content_type],
              content_disposition: options[:content_disposition],
              content_encoding: options[:content_encoding],
              cache_control: options[:cache_control],
              metadata: options[:metadata],
              acl: options[:acl],
              **options.except(:content_type, :content_disposition, :content_encoding, :cache_control, :metadata, :acl)
            )
          rescue Aws::S3::Errors::BadDigest
            raise ActiveStorage::IntegrityError
          end
        end
      end
    end
  end
end
