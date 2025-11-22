# config/initializers/active_storage_r2_fix.rb

# Garante que a classe S3Service seja carregada antes de tentar modificá-la.
require "active_storage/service/s3_service"

# Este código corrige o erro "Aws::S3::Errors::InvalidRequest: You can only specify one non-default checksum at a time."
# que ocorre ao usar o Active Storage com o Cloudflare R2.
# Ele desabilita o cálculo e envio do checksum no momento do upload.

if defined?(ActiveStorage::Service::S3Service)
  ActiveStorage::Service::S3Service.class_eval do
    # Sobrescreve o método de upload para remover o parâmetro de checksum que causa o erro no R2.
    def upload(key, io, checksum: nil, **options)
      instrument :upload, key: key, checksum: checksum do
        begin
          # O método put_object é chamado sem o parâmetro checksum_algorithm,
          # que é o que o Cloudflare R2 não suporta.
          object_for(key).put(body: io, content_md5: checksum, **options)
        rescue Aws::S3::Errors::BadDigest
          raise ActiveStorage::IntegrityError
        end
      end
    end
  end
end
