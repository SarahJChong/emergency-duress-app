using System.Linq.Expressions;
using MongoDB.Bson;
using MongoDB.Driver;

namespace Api.Services;

/// <summary>
/// MongoDB implementation of the generic repository pattern
/// </summary>
/// <typeparam name="T">The type of entity this repository handles</typeparam>
/// <param name="database">The MongoDB database instance</param>
/// <param name="collectionName">The name of the collection in the database</param>
public class MongoRepository<T>(IMongoDatabase database, string collectionName) : IRepository<T>
    where T : class
{
    private readonly IMongoCollection<T> _collection = database.GetCollection<T>(collectionName);

    /// <inheritdoc />
    public async Task<T?> GetByIdAsync(string id)
    {
        return await _collection.Find(Builders<T>.Filter.Eq("_id", new ObjectId(id))).FirstOrDefaultAsync();
    }

    /// <inheritdoc />
    public async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _collection.Find(_ => true).ToListAsync();
    }

    /// <inheritdoc />
    public async Task<T?> FindUniqueAsync(Expression<Func<T, bool>> predicate)
    {
        return await _collection.Find(predicate).FirstOrDefaultAsync();
    }

    /// <inheritdoc />
    public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await _collection.Find(predicate).ToListAsync();
    }

    /// <inheritdoc />
    public async Task<T> AddAsync(T entity)
    {
        await _collection.InsertOneAsync(entity);
        return entity;
    }

    /// <inheritdoc />
    public async Task UpdateAsync(string id, T entity)
    {
        await _collection.ReplaceOneAsync(Builders<T>.Filter.Eq("_id", new ObjectId(id)), entity);
    }

    /// <inheritdoc />
    public async Task DeleteAsync(string id)
    {
        await _collection.DeleteOneAsync(Builders<T>.Filter.Eq("_id", new ObjectId(id)));
    }

    /// <inheritdoc />
    public async Task<long> CountAsync(Expression<Func<T, bool>>? predicate = null)
    {
        return predicate == null
            ? await _collection.CountDocumentsAsync(_ => true)
            : await _collection.CountDocumentsAsync(predicate);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<TResult>> AggregateAsync<TResult>(PipelineDefinition<T, TResult> pipeline)
    {
        return await _collection.Aggregate(pipeline).ToListAsync();
    }
}