# config/initializers/active_storage_r2_fix.rb

# Garante que a classe S3Service seja carregada.
require "active_storage/service/s3_service"

# Esta correção é necessária porque o Cloudflare R2 (e algumas versões antigas do AWS SDK)
# não suportam o parâmetro :checksum_algorithm que o Active Storage tenta passar.
if defined?(ActiveStorage::Service::S3Service)
  ActiveStorage::Service::S3Service.class_eval do
    # Sobrescreve o método de upload para remover o parâmetro problemático.
    def upload(key, io, checksum: nil, **options)
      # Remove o parâmetro :checksum_algorithm das opções antes de chamar o método put_object.
      # O Rails 8.1.1 usa o método put_object do cliente AWS S3.
      
      # O Active Storage passa todas as opções para o put_object, incluindo as que não são suportadas.
      # A chave para o erro é que o Active Storage passa o checksum_algorithm como uma opção.
      
      # Esta é a lógica de upload do Active Storage, modificada para remover o checksum_algorithm
      instrument :upload, key: key, checksum: checksum do
        begin
          # Remove a opção que causa o erro no SDK antigo
          options.delete(:checksum_algorithm)
          
          # Chama o método put_object do cliente S3, que é o que o Active Storage faz internamente.
          client.put_object(
            bucket: bucket,
            key: key,
            body: io,
            content_md5: checksum,
            **options
          )
        rescue Aws::S3::Errors::BadDigest
          raise ActiveStorage::IntegrityError
        end
      end
    end
  end
end
