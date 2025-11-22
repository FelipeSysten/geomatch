# config/initializers/active_storage_r2_fix.rb

# Este código corrige o erro "Aws::S3::Errors::InvalidRequest: You can only specify one non-default checksum at a time."
# que ocorre ao usar o Active Storage com o Cloudflare R2.
# Ele desabilita o cálculo e envio do checksum no momento do upload, garantindo compatibilidade.

ActiveSupport.on_load(:active_storage_blob) do
  ActiveStorage::Service::S3Service.class_eval do
    # Sobrescreve o método de upload para remover o parâmetro de checksum que causa o erro no R2.
    # A implementação original pode ser encontrada na documentação do Rails ou no código-fonte.
    # Esta versão é simplificada para focar na remoção do problema.
    def upload(key, io, checksum: nil, **options)
      instrument :upload, key: key, checksum: checksum do
        begin
          # A chamada para put_object é modificada para não passar o checksum_algorithm
          # e depender apenas do content_md5, que é o comportamento esperado.
          object_for(key).put(body: io, content_md5: checksum, **options)
        rescue Aws::S3::Errors::BadDigest
          raise ActiveStorage::IntegrityError
        end
      end
    end
  end
end
